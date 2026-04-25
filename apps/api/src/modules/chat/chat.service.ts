import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThanOrEqual, DataSource, In } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { MessageType, PayoutStatus, ConsultationStatus } from '@repo/shared';
import { format } from 'date-fns';
import { AiService } from '../ai/ai.service';
import { TrustScoreService } from '../users/trust-score.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomsRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private dataSource: DataSource,
    private aiService: AiService,
    private trustScoreService: TrustScoreService,
    private activitiesService: ActivitiesService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {}

  async getAgoraToken(roomId: string, userId: string) {
    const room = await this.chatRoomsRepository.findOne({
      where: { id: roomId },
      relations: ['consultation', 'consultation.patient', 'consultation.specialist', 'patient', 'specialist'],
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    // Verify user belongs to the room
    const isParticipant = 
      room.patient?.id === userId || 
      room.specialist?.id === userId || 
      room.consultation?.patient?.id === userId || 
      room.consultation?.specialist?.id === userId;

    if (!isParticipant) {
      throw new BadRequestException('You are not authorized to join this call');
    }

    if (room.consultation) {
        const allowedStatuses = [ConsultationStatus.CONFIRMED, ConsultationStatus.UPCOMING, ConsultationStatus.IN_PROGRESS];
        if (!allowedStatuses.includes(room.consultation.status as any)) {
            throw new BadRequestException('Cannot start call for a completed or cancelled consultation.');
        }
    }

    // Calculate remaining time
    const now = new Date();
    let remainingSeconds = 3600; // Default 1 hour for direct chat calls if no consultation linked
    
    if (room.consultation) {
        const scheduledStartTime = new Date(room.consultation.scheduledAt);
        const durationMinutes = room.consultation.duration || 30;
        const gracePeriodMinutes = 5;
        const sessionEndTime = new Date(scheduledStartTime.getTime() + (durationMinutes + gracePeriodMinutes) * 60 * 1000);
        
        if (now > sessionEndTime) {
            throw new BadRequestException('This consultation session has expired.');
        }
        remainingSeconds = Math.floor((sessionEndTime.getTime() - now.getTime()) / 1000);
    }

    const appId = this.configService.get<string>('AGORA_APP_ID');
    const appCertificate = this.configService.get<string>('AGORA_APP_CERTIFICATE');
    const channelName = roomId;
    const uid = 0; 
    const role = RtcRole.PUBLISHER;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + remainingSeconds;

    if (!appId || !appCertificate) {
      this.logger.error('Agora configuration missing');
      throw new InternalServerErrorException('Video service configuration error');
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    return {
      token,
      channelName,
      appId,
      remainingSeconds
    };
  }

  async findRoom(id: string, userId: string): Promise<any> {
    let room = await this.chatRoomsRepository.findOne({
      where: { id },
      relations: ['consultation', 'consultation.patient', 'consultation.specialist', 'patient', 'specialist'],
    });

    if (!room) {
        // Check if ID is a consultation ID
        const consultation = await this.dataSource.getRepository(Consultation).findOne({ 
            where: { id },
            relations: ['patient', 'specialist']
        });

        if (consultation) {
            room = new ChatRoom();
            room.id = id;
            room.consultation = consultation;
            await this.chatRoomsRepository.save(room);
            
            // Reload with relations
            room = await this.chatRoomsRepository.findOne({
                where: { id },
                relations: ['consultation', 'consultation.patient', 'consultation.specialist', 'patient', 'specialist'],
            });
        } else {
            throw new NotFoundException('Chat room not found');
        }
    }

    const partner = (room.patient?.id === userId || room.consultation?.patient?.id === userId)
      ? (room.specialist || room.consultation?.specialist)
      : (room.patient || room.consultation?.patient);

    const getDisplayName = (u: any) => {
      if (u.fullName) return u.fullName;
      if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
      if (u.firstName) return u.firstName;
      return u.email ? u.email.split('@')[0] : 'User';
    };

    return {
      id: room.id,
      consultationId: room.consultation.id,
      status: room.consultation.status,
      partner: {
        id: partner.id,
        fullName: getDisplayName(partner),
        avatarUrl: (partner as any).avatarUrl,
        email: (partner as any).email,
        phone: (partner as any).phoneNumber || (partner as any).specialistProfile?.phoneNumber,
      },
    };
  }

  async findUserRooms(userId: string): Promise<any[]> {
    // 1. Fetch all rooms where user is a participant (either as patient or specialist)
    const rooms = await this.chatRoomsRepository.find({
        where: [
            { consultation: { patient: { id: userId } } },
            { consultation: { specialist: { id: userId } } },
            { patient: { id: userId } },
            { specialist: { id: userId } },
        ],
        relations: ['consultation', 'consultation.patient', 'consultation.specialist', 'patient', 'specialist'],
        order: { updatedAt: 'DESC' }
    });

    // 2. Group these rooms by the "Partner" (the other person)
    const partnersMap = new Map<string, any>();

    for (const room of rooms) {
        const partner = (room.patient?.id === userId || room.consultation?.patient?.id === userId)
            ? (room.specialist || room.consultation?.specialist)
            : (room.patient || room.consultation?.patient);

        if (!partner) continue;

        if (!partnersMap.has(partner.id)) {
            partnersMap.set(partner.id, {
                partner,
                rooms: [],
                latestMessage: null,
                unreadCount: 0,
                activeConsultation: null
            });
        }
        
        const entry = partnersMap.get(partner.id);
        entry.rooms.push(room.id);
        
        // Track the most recent consultation as the "active" one for this row
        // We also track the actual room ID associated with this pair
        if (!entry.activeConsultation || new Date(room.consultation?.createdAt) > new Date(entry.activeConsultation.createdAt)) {
            entry.activeConsultation = room.consultation;
            entry.chatRoomId = room.id;
        }
    }

    // 3. For each unique partner, fetch the latest message and total unread count across all shared rooms
    const summaries = await Promise.all(Array.from(partnersMap.values()).map(async (entry) => {
        const latestMessage = await this.messagesRepository.findOne({
            where: { chatRoom: { id: In(entry.rooms) } },
            relations: ['sender'],
            order: { createdAt: 'DESC' }
        });

        const unreadCount = await this.messagesRepository.count({
            where: { 
                chatRoom: { id: In(entry.rooms) },
                sender: { id: Not(userId) },
                readAt: IsNull()
            }
        });

        const getDisplayName = (u: any) => {
            if (u.fullName) return u.fullName;
            if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
            return u.email ? u.email.split('@')[0] : 'User';
        };

        return {
            id: entry.chatRoomId || entry.rooms[0], // Use the unified Chat Room ID for the thread
            partnerId: entry.partner.id,
            consultationId: entry.activeConsultation?.id,
            status: entry.activeConsultation?.status,
            chatLockedBy: entry.activeConsultation?.chatLockedBy,
            chatClosesAt: entry.activeConsultation?.chatClosesAt,
            lastMessage: latestMessage ? {
                id: latestMessage.id,
                content: latestMessage.content,
                createdAt: latestMessage.createdAt,
                senderId: latestMessage.sender.id,
                senderName: getDisplayName(latestMessage.sender),
            } : null,
            unreadCount,
            partner: {
                id: entry.partner.id,
                fullName: getDisplayName(entry.partner),
                avatarUrl: entry.partner.avatarUrl,
                role: entry.partner.activeRole,
                phone: entry.partner.phoneNumber || entry.partner.specialistProfile?.phoneNumber
            }
        };
    }));

    // 4. Final sort by latest message globally
    return summaries.sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return dateB - dateA;
    });
  }

  async getMessages(roomId: string, page: number = 1, limit: number = 50, userId?: string) {
    // 1. Resolve all rooms shared between the users involved in this roomId
    let targetRoom = await this.chatRoomsRepository.findOne({
        where: { id: roomId },
        relations: ['consultation', 'consultation.patient', 'consultation.specialist', 'patient', 'specialist']
    });

    if (!targetRoom) {
        // Auto-create room if it's a valid consultation
        const consultation = await this.dataSource.getRepository(Consultation).findOne({ 
            where: { id: roomId },
            relations: ['patient', 'specialist']
        });

        if (consultation) {
            targetRoom = new ChatRoom();
            targetRoom.id = roomId;
            targetRoom.consultation = consultation;
            await this.chatRoomsRepository.save(targetRoom);
            
            targetRoom = await this.chatRoomsRepository.findOne({
                where: { id: roomId },
                relations: ['consultation', 'consultation.patient', 'consultation.specialist', 'patient', 'specialist']
            });
        } else {
            throw new NotFoundException('Room not found');
        }
    }

    const partnerId = (targetRoom.patient?.id === userId || targetRoom.consultation?.patient?.id === userId)
        ? (targetRoom.specialist?.id || targetRoom.consultation?.specialist?.id)
        : (targetRoom.patient?.id || targetRoom.consultation?.patient?.id);

    // Find all shared rooms between these two specific users
    const sharedRooms = await this.chatRoomsRepository.find({
        where: [
            { consultation: { patient: { id: userId }, specialist: { id: partnerId } } },
            { consultation: { patient: { id: partnerId }, specialist: { id: userId } } },
            { patient: { id: userId }, specialist: { id: partnerId } },
            { patient: { id: partnerId }, specialist: { id: userId } },
        ],
        relations: ['consultation']
    });

    const roomIds = sharedRooms.map(r => r.id);

    // 2. Fetch messages from all shared rooms, sorted by date DESC (for pagination)
    const [items, total] = await this.messagesRepository.findAndCount({
      where: {
        chatRoom: { id: In(roomIds) }
      },
      relations: ['sender', 'replyTo', 'chatRoom', 'chatRoom.consultation'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 3. Transform messages to include session dividers
    // Reverse here to show oldest first in the final list
    const sortedItems = [...items].reverse();

    const transformedItems = sortedItems.map(m => ({
        ...m,
        isSessionDivider: false,
        consultationLabel: m.chatRoom.consultation ? `Consultation · ${format(new Date(m.chatRoom.consultation.createdAt), 'MMM dd, yyyy')}` : null
    }));

    return {
      items: transformedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async saveMessage(roomId: string, userId: string, data: {
      content: string;
      type?: MessageType;
      replyToId?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
  }) {
    // Ensure room exists
    let room = await this.chatRoomsRepository.findOne({
        where: { id: roomId },
        relations: ['consultation']
    });

    if (!room) {
        const consultation = await this.dataSource.getRepository(Consultation).findOne({ where: { id: roomId } });
        if (consultation) {
            room = new ChatRoom();
            room.id = roomId;
            room.consultation = consultation;
            await this.chatRoomsRepository.save(room);
        } else {
            throw new NotFoundException('Chat room or consultation not found');
        }
    }

    // LOCK CHECK
    const consultation = room.consultation as any;
    if (consultation.status === 'ARCHIVED' || (consultation.chatClosesAt && new Date() > new Date(consultation.chatClosesAt))) {
        throw new ForbiddenException('Chat is closed for this consultation');
    }

    const message = new Message();
    message.chatRoom = room;
    message.sender = { id: userId } as any;
    message.content = data.content;
    message.type = data.type || MessageType.TEXT;
    message.replyToId = data.replyToId;
    message.fileUrl = data.fileUrl;
    message.fileName = data.fileName;
    message.fileSize = data.fileSize;
    message.mimeType = data.mimeType;

    // AI Off-Platform Solicitation Detection
    if (data.content && data.content.length > 10) {
        // Run asynchronously so we don't block the message delivery entirely
        this.aiService.detectOffPlatformSolicitation(data.content).then(async (fraudCheck) => {
            if (fraudCheck?.isSoliciting) {
                this.logger.warn(`Solicitation detected in room ${roomId}: ${fraudCheck.reason}`);
                // Penalize score
                await this.trustScoreService.updateSpecialistScore(userId, 'OFF_PLATFORM_FLAG');
                
                // Hold payout
                if (consultation && consultation.id) {
                    await this.dataSource.getRepository(Consultation).update(consultation.id, {
                        payoutStatus: PayoutStatus.HELD,
                        payoutNote: 'AI flagged potential off-platform solicitation in chat.'
                    });
                }
                
                // Log activity
                await this.activitiesService.create(userId, 'FRAUD_DETECTED', 'Off-Platform Solicitation', `Your message was flagged for attempting to move a consultation off-platform.`);
            }
        }).catch(err => this.logger.error('Solicitation check failed: ' + err.message));
    }

    const savedMessage = await this.messagesRepository.save(message);

    // Send Push Notification to partner
    try {
        const roomWithParticipants = await this.chatRoomsRepository.findOne({
            where: { id: roomId },
            relations: ['patient', 'specialist', 'consultation', 'consultation.patient', 'consultation.specialist']
        });

        if (roomWithParticipants) {
            const sender = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
            
            const participants = [
                roomWithParticipants.patient,
                roomWithParticipants.specialist,
                roomWithParticipants.consultation?.patient,
                roomWithParticipants.consultation?.specialist
            ].filter(p => p !== null && p !== undefined);

            // Find the first participant whose ID is not the current user's ID
            const partner = participants.find(p => p.id !== userId);

            this.logger.debug(`Push Notification Debug: SenderID=${userId}, PartnerID=${partner?.id}, FoundParticipants=${participants.length}`);

            if (partner && sender) {
                const senderName = sender.fullName || sender.email.split('@')[0];
                await this.notificationsService.sendToUser(partner.id, {
                    title: `New message from ${senderName}`,
                    body: data.type === MessageType.DOCUMENT ? 'Sent a file' : data.content,
                    type: 'CHAT_MESSAGE',
                    metadata: { 
                        chatId: roomId,
                        senderName: senderName 
                    },
                    skipSave: true
                });
            }
        }
    } catch (pushErr) {
        this.logger.error(`Failed to send chat push: ${pushErr.message}`);
    }

    return savedMessage;
  }

  async markRoomAsRead(roomId: string, userId: string) {
    await this.messagesRepository.update(
      {
        chatRoom: { id: roomId },
        sender: { id: Not(userId) } as any,
        readAt: IsNull(),
      },
      { readAt: new Date() },
    );
    return { success: true };
  }

  async getTotalUnread(userId: string): Promise<number> {
    const rooms = await this.chatRoomsRepository.find({
        where: [
            { consultation: { patient: { id: userId } } },
            { consultation: { specialist: { id: userId } } },
            { patient: { id: userId } },
            { specialist: { id: userId } },
        ]
    });

    if (rooms.length === 0) return 0;

    return this.messagesRepository.count({
        where: {
            chatRoom: { id: In(rooms.map(r => r.id)) },
            sender: { id: Not(userId) },
            readAt: IsNull()
        }
    });
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
      const message = await this.messagesRepository.findOne({ where: { id: messageId } });
      if (!message) throw new NotFoundException('Message not found');

      let reactions = message.reactions || [];
      const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);

      if (existingReactionIndex > -1) {
          const userIndex = reactions[existingReactionIndex].userIds.indexOf(userId);
          if (userIndex > -1) {
              // Remove reaction
              reactions[existingReactionIndex].userIds.splice(userIndex, 1);
              if (reactions[existingReactionIndex].userIds.length === 0) {
                  reactions.splice(existingReactionIndex, 1);
              }
          } else {
              // Add user to existing emoji
              reactions[existingReactionIndex].userIds.push(userId);
          }
      } else {
          // Add new emoji reaction
          reactions.push({ emoji, userIds: [userId] });
      }

      message.reactions = reactions;
      return this.messagesRepository.save(message);
  }
}
