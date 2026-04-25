import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { DeviceToken } from './entities/device-token.entity';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;
  private firebaseApp: admin.app.App;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
  ) {
    // Initialize Firebase Admin SDK
    const projectId = this.configService.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      try {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        }, 'rubimedik-firebase');
        this.logger.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK', error.stack);
      }
    } else {
      this.logger.warn('Firebase credentials missing. Android push notifications via Firebase will be disabled.');
    }
  }

  onModuleInit() {
    // Initialize Expo SDK
    this.expo = new Expo();
    this.logger.log('Expo Push SDK initialized');
  }

  /**
   * Register or update a device token for push notifications
   */
  async registerToken(userId: string, token: string, platform: string) {
    const validPlatform = ['ios', 'android', 'web'].includes(platform.toLowerCase()) 
      ? platform.toLowerCase() 
      : 'android';

    // If it's NOT android, we strictly require an Expo token
    if (validPlatform !== 'android' && !Expo.isExpoPushToken(token)) {
      this.logger.error(`Push token ${token} is not a valid Expo push token for ${validPlatform}`);
      return;
    }

    try {
      // 1. Remove this token from any other users to prevent duplicate delivery 
      // (important when switching accounts on the same device)
      await this.deviceTokenRepository.delete({ token });

      // 2. Upsert: Find existing entry for this user/platform and update it, or create new
      const existingToken = await this.deviceTokenRepository.findOne({
        where: { user: { id: userId }, platform: validPlatform },
      });

      if (existingToken) {
        existingToken.token = token;
        existingToken.updatedAt = new Date();
        await this.deviceTokenRepository.save(existingToken);
      } else {
        const newToken = this.deviceTokenRepository.create({
          user: { id: userId } as any,
          token,
          platform: validPlatform,
        });
        await this.deviceTokenRepository.save(newToken);
      }

      this.logger.log(`Registered ${validPlatform} token for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to register token for user ${userId}`, error.stack);
    }
  }

  /**
   * Compatibility method for older implementations
   */
  async sendNotification(userId: string, title: string, message: string, type?: string, metadata?: any, skipSave: boolean = false) {
    return this.sendToUser(userId, {
      title,
      body: message,
      type: type || 'GENERAL',
      metadata,
      skipSave,
    });
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(userId: string, data: {
    title: string;
    body: string;
    type: string;
    metadata?: Record<string, any>;
    skipSave?: boolean;
  }) {
    // 1. Save to database for in-app history (unless skipped)
    if (!data.skipSave) {
        try {
            const notification = this.notificationsRepository.create({
              user: { id: userId } as any,
              title: data.title,
              message: data.body,
              type: data.type,
              metadata: data.metadata,
            });
            await this.notificationsRepository.save(notification);
            this.logger.log(`Notification saved to DB for user ${userId}: ${data.title}`);
        } catch (dbErr) {
            this.logger.error(`Failed to save notification to DB for user ${userId}`, dbErr.stack);
        }
    } else {
        this.logger.log(`Skipping DB save for notification to user ${userId}: ${data.title}`);
    }

    // 2. Fetch device tokens
    const tokens = await this.deviceTokenRepository.find({
      where: { user: { id: userId } },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No device tokens found for user ${userId}. Push skipped, only in-app saved.`);
      return;
    }

    // 3. Split tokens by platform and dispatch
    const expoMessages: ExpoPushMessage[] = [];
    const firebaseTokens: string[] = [];

    tokens.forEach(t => {
      if (t.platform === 'android' && this.firebaseApp) {
        firebaseTokens.push(t.token);
      } else if (Expo.isExpoPushToken(t.token)) {
        expoMessages.push({
          to: t.token,
          sound: 'default',
          title: data.title,
          body: data.body,
          data: { 
            type: data.type,
            ...data.metadata 
          },
          priority: 'high',
        });
      }
    });

    // 4. Send via Expo
    if (expoMessages.length > 0) {
        await this.sendExpoPush(expoMessages);
    }

    // 5. Send via Firebase (Direct Android)
    if (firebaseTokens.length > 0 && this.firebaseApp) {
        await this.sendFirebasePush(firebaseTokens, data);
    }
  }

  /**
   * Internal method to handle Firebase push delivery
   */
  private async sendFirebasePush(tokens: string[], data: any) {
    try {
        const message: admin.messaging.MulticastMessage = {
            tokens,
            notification: {
                title: data.title,
                body: data.body,
            },
            data: {
                type: data.type,
                ...Object.keys(data.metadata || {}).reduce((acc, key) => {
                    acc[key] = String(data.metadata[key]);
                    return acc;
                }, {}),
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'default',
                },
            },
        };

        const response = await this.firebaseApp.messaging().sendEachForMulticast(message);
        this.logger.log(`Firebase push sent: ${response.successCount} success, ${response.failureCount} failure`);
    } catch (error) {
        this.logger.error('Error sending Firebase push notification', error.stack);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], data: {
    title: string;
    body: string;
    type: string;
    metadata?: Record<string, any>;
    skipSave?: boolean;
  }) {
    // Bulk create database notifications (unless skipped)
    if (!data.skipSave) {
        const notifications = userIds.map(userId => 
          this.notificationsRepository.create({
            user: { id: userId } as any,
            title: data.title,
            message: data.body,
            type: data.type,
            metadata: data.metadata,
          })
        );
        await this.notificationsRepository.save(notifications);
    }

    // Bulk fetch tokens
    const tokens = await this.deviceTokenRepository.find({
      where: { user: { id: In(userIds) } },
    });

    if (tokens.length === 0) return;

    // Prepare messages
    const messages: ExpoPushMessage[] = tokens.map(t => ({
      to: t.token,
      sound: 'default',
      title: data.title,
      body: data.body,
      data: { 
        type: data.type,
        ...data.metadata 
      },
    }));

    await this.sendExpoPush(messages);
  }

  /**
   * Internal method to handle Expo push delivery with chunking
   */
  private async sendExpoPush(messages: ExpoPushMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        this.logger.error('Error sending push notification chunk', error.stack);
      }
    }

    // Note: In a production app, you should handle receipts to clean up invalid tokens
    // this.handlePushTickets(tickets);
  }

  async getMyNotifications(userId: string) {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string) {
    return this.notificationsRepository.update(notificationId, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.update({ user: { id: userId } }, { isRead: true });
  }

  async deleteOne(id: string) {
    return this.notificationsRepository.delete(id);
  }

  async deleteAll(userId: string) {
    return this.notificationsRepository.delete({ user: { id: userId } });
  }
}
