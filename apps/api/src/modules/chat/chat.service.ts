import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThanOrEqual, DataSource, In } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { MessageType, PayoutStatus, ConsultationStatus, SupportTicketStatus, UserRole } from '@repo/shared';
import { format } from 'date-fns';
import { AiService } from '../ai/ai.service';
import { TrustScoreService } from '../users/trust-score.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { SupportTicket } from '../support/entities/support-ticket.entity';

import { Subject } from 'rxjs';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  public readonly messageEmitter = new Subject<any>();

  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomsRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(SupportTicket)
    private supportTicketsRepository: Repository<SupportTicket>,
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
        const status = room.consultation.status;
        if (!status || !allowedStatuses.includes(status as any)) {
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
        // 1. Check if ID is a Support Ticket ID
        const ticket = await this.supportTicketsRepository.findOne({
            where: { id },
            relations: ['chatRoom', 'user', 'assignedAdmin']
        });

        if (ticket) {
            room = ticket.chatRoom;
        } else {
            // 2. Check if ID is a consultation ID
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
                // 3. Check if ID is a User ID (for Direct Chat/Support)
                const otherUser = await this.dataSource.getRepository(User).findOne({ where: { id } });
                if (otherUser) {
                    // Try to find if a direct room already exists between these two users
                    room = await this.chatRoomsRepository.findOne({
                        where: [
                            { patient: { id: userId }, specialist: { id: otherUser.id } },
                            { patient: { id: otherUser.id }, specialist: { id: userId } }
                        ],
                        relations: ['patient', 'specialist']
                    });

                    if (!room) {
                        // Create new direct room
                        room = new ChatRoom();
                        const currentUser = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
                        
                        if (currentUser.activeRole === 'SPECIALIST') {
                            room.specialist = currentUser;
                            room.patient = otherUser;
                        } else {
                            room.patient = currentUser;
                            room.specialist = otherUser;
                        }
                        await this.chatRoomsRepository.save(room);
                    }
                } else {
                    throw new NotFoundException('Chat room or partner not found');
                }
            }
        }
    }

    // Identify partner for the room
    // Check if it's a support ticket room first
    const supportTicket = await this.supportTicketsRepository.findOne({
        where: { chatRoom: { id: room.id } },
        relations: ['user', 'assignedAdmin']
    });

    let partner: any;
    const supportAvatar = 'https://res.cloudinary.com/africinnovate-technology/image/upload/v1777228149/rubimedik/support_icon.png'; // Placeholder or system icon

    if (supportTicket) {
        partner = (userId === supportTicket.user.id) 
            ? (supportTicket.assignedAdmin || { id: 'admin', fullName: 'Rubimedik Support', avatarUrl: supportAvatar })
            : supportTicket.user;
        // Ensure system admin has the avatar even if assigned
        if (partner.id === supportTicket.assignedAdmin?.id && !partner.avatarUrl) {
            partner.avatarUrl = supportAvatar;
        }
    } else {
        partner = (room.patient?.id === userId || room.consultation?.patient?.id === userId)
            ? (room.specialist || room.consultation?.specialist)
            : (room.patient || room.consultation?.patient);
    }

    const getDisplayName = (u: any) => {
      if (u.fullName) return u.fullName;
      if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
      if (u.firstName) return u.firstName;
      return u.email ? u.email.split('@')[0] : 'User';
    };

    return {
      id: room.id,
      consultationId: room.consultation?.id,
      status: supportTicket ? supportTicket.status : room.consultation?.status,
      isSupport: !!supportTicket,
      ticketStatus: supportTicket?.status,
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
    // 1. Fetch all rooms where user is a participant
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

    // 1.1 Fetch all support rooms for this user
    const userTickets = await this.supportTicketsRepository.find({
        where: [
            { user: { id: userId } },
            { assignedAdmin: { id: userId } }
        ],
        relations: ['chatRoom', 'user', 'assignedAdmin', 'chatRoom.consultation']
    });

    const allRooms = [...rooms];
    for (const ticket of userTickets) {
        if (ticket.chatRoom && !allRooms.some(r => r.id === ticket.chatRoom.id)) {
            allRooms.push(ticket.chatRoom);
        }
    }

    // 2. Group these rooms by the "Partner" (the other person)
    const partnersMap = new Map<string, any>();

    for (const room of allRooms) {
        // Find if this is a support room
        const supportTicket = userTickets.find(t => t.chatRoom?.id === room.id) || 
            await this.supportTicketsRepository.findOne({ 
                where: { chatRoom: { id: room.id } },
                relations: ['user', 'assignedAdmin']
            });

        let partner: any;
        const supportAvatar = 'https://res.cloudinary.com/africinnovate-technology/image/upload/v1777228149/rubimedik/support_icon.png';

        if (supportTicket) {
            partner = (userId === supportTicket.user.id) 
                ? (supportTicket.assignedAdmin || { id: 'admin', fullName: 'Rubimedik Support', avatarUrl: supportAvatar })
                : supportTicket.user;
            
            if (partner.id === supportTicket.assignedAdmin?.id && !partner.avatarUrl) {
                partner.avatarUrl = supportAvatar;
            }
        } else {
            partner = (room.patient?.id === userId || room.consultation?.patient?.id === userId)
                ? (room.specialist || room.consultation?.specialist)
                : (room.patient || room.consultation?.patient);
        }

        if (!partner) continue;

        if (!partnersMap.has(partner.id)) {
            partnersMap.set(partner.id, {
                partner,
                rooms: [],
                latestMessage: null,
                unreadCount: 0,
                activeConsultation: null,
                isSupport: !!supportTicket,
                ticketStatus: supportTicket?.status
            });
        }
        
        const entry = partnersMap.get(partner.id);
        entry.rooms.push(room.id);
        
        // Track the most recent consultation
        if (room.consultation && (!entry.activeConsultation || new Date(room.consultation.createdAt) > new Date(entry.activeConsultation.createdAt))) {
            entry.activeConsultation = room.consultation;
            entry.chatRoomId = room.id;
        } else if (!entry.chatRoomId) {
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

        const supportTicket = await this.supportTicketsRepository.findOne({
            where: { chatRoom: { id: entry.chatRoomId } }
        });

        return {
            id: entry.chatRoomId || entry.rooms[0], // Use the unified Chat Room ID for the thread
            partnerId: entry.partner.id,
            consultationId: entry.activeConsultation?.id,
            status: entry.activeConsultation?.status,
            isSupport: !!supportTicket,
            ticketStatus: supportTicket?.status,
            chatLockedBy: entry.activeConsultation?.chatLockedBy,
            chatClosesAt: entry.activeConsultation?.chatClosesAt,
            lastMessage: latestMessage ? {
                id: latestMessage.id,
                content: latestMessage.content,
                createdAt: latestMessage.createdAt,
                senderId: latestMessage.sender?.id,
                senderName: latestMessage.sender ? getDisplayName(latestMessage.sender) : 'System',
            } : null,
            unreadCount,
            partner: {
                id: entry.partner.id,
                fullName: supportTicket ? 'Rubimedik Support' : getDisplayName(entry.partner),
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
        // 1. Check if it's a Support Ticket ID
        const ticket = await this.supportTicketsRepository.findOne({
            where: { id: roomId },
            relations: ['chatRoom']
        });
        
        if (ticket) {
            targetRoom = ticket.chatRoom;
        } else {
            // 2. Check if it's a consultation ID
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
    }

    // Determine room IDs to fetch messages from
    let roomIds: string[] = [];

    // Check if it's a support ticket room
    const supportTicket = await this.supportTicketsRepository.findOne({
        where: { chatRoom: { id: targetRoom.id } }
    });

    if (supportTicket) {
        // For support tickets, we only want messages from this specific room
        roomIds = [targetRoom.id];
    } else {
        // For consultations/direct chats, find all shared rooms between these two specific users
        const partnerId = (targetRoom.patient?.id === userId || targetRoom.consultation?.patient?.id === userId)
            ? (targetRoom.specialist?.id || targetRoom.consultation?.specialist?.id)
            : (targetRoom.patient?.id || targetRoom.consultation?.patient?.id);

        const sharedRooms = await this.chatRoomsRepository.find({
            where: [
                { consultation: { patient: { id: userId }, specialist: { id: partnerId } } },
                { consultation: { patient: { id: partnerId }, specialist: { id: userId } } },
                { patient: { id: userId }, specialist: { id: partnerId } },
                { patient: { id: partnerId }, specialist: { id: userId } },
            ]
        });
        roomIds = sharedRooms.map(r => r.id);
    }

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
        // 1. Check if ID is a Support Ticket ID
        const ticket = await this.supportTicketsRepository.findOne({
            where: { id: roomId },
            relations: ['chatRoom']
        });

        if (ticket) {
            room = ticket.chatRoom;
        } else {
            // 2. Check if ID is a consultation ID
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
    }

    // LOCK CHECK - Only for consultations
    const consultation = room.consultation as any;
    if (consultation) {
        if (consultation.status === 'ARCHIVED' || (consultation.chatClosesAt && new Date() > new Date(consultation.chatClosesAt))) {
            throw new ForbiddenException('Chat is closed for this consultation');
        }
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

    // AI Support Triage
    // RELOAD ticket with relations to ensure assignedAdmin check works
    const supportTicket = await this.supportTicketsRepository.findOne({
        where: { chatRoom: { id: roomId } },
        relations: ['user', 'assignedAdmin']
    });

    if (supportTicket) {
        // AUTO-ASSIGN ADMIN: If sender is an admin and no admin is assigned yet
        const sender = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
        if (sender && sender.roles.includes(UserRole.ADMIN) && !supportTicket.assignedAdmin) {
            supportTicket.assignedAdmin = sender;
            if (supportTicket.status === SupportTicketStatus.AI_TRIAGE) {
                supportTicket.status = SupportTicketStatus.ESCALATED;
            }
            await this.supportTicketsRepository.save(supportTicket);
            this.logger.log(`Admin ${sender.email} auto-assigned to ticket ${supportTicket.id}`);
        }
    }

    this.logger.log(`AI Triage Check: Room=${roomId}, Ticket=${supportTicket?.id}, Status=${supportTicket?.status}, Admin=${supportTicket?.assignedAdmin?.id}`);

    if (supportTicket && (supportTicket.status === SupportTicketStatus.AI_TRIAGE || (supportTicket.status === SupportTicketStatus.ESCALATED && !supportTicket.assignedAdmin)) && userId !== supportTicket.user.id) {
        // Don't respond if message is NOT from the ticket owner (prevent AI loop)
    } else if (supportTicket && (supportTicket.status === SupportTicketStatus.AI_TRIAGE || (supportTicket.status === SupportTicketStatus.ESCALATED && !supportTicket.assignedAdmin))) {
        this.logger.log(`AI Generating Response for ticket ${supportTicket.id}`);
        this.aiService.generateSupportResponse(supportTicket, data.content).then(async (aiRes) => {
            this.logger.log(`AI Response generated: ${aiRes.reply.substring(0, 20)}...`);
            // Save AI reply
            const aiMessage = new Message();
            aiMessage.chatRoom = room;
            aiMessage.sender = null; // System/AI
            aiMessage.content = aiRes.reply;
            aiMessage.type = MessageType.TEXT;
            const savedAiMessage = await this.messagesRepository.save(aiMessage);
            
            // Emit to socket
            this.messageEmitter.next({ roomId: room.id, message: savedAiMessage });

            if (aiRes.shouldEscalate && supportTicket.status !== SupportTicketStatus.ESCALATED) {
                this.logger.log(`AI Escalating ticket ${supportTicket.id}`);
                supportTicket.status = SupportTicketStatus.ESCALATED;
                await this.supportTicketsRepository.save(supportTicket);
                
                // Notify all admins of escalation
                const admins = await this.dataSource.getRepository(User).createQueryBuilder('user')
                    .where("'ADMIN' = ANY(user.roles)")
                    .getMany();
                
                for (const admin of admins) {
                    await this.notificationsService.sendToUser(admin.id, {
                        title: 'Support Escalation',
                        body: `A ticket has been escalated: ${supportTicket.subject}`,
                        type: 'SUPPORT_TICKET',
                        metadata: { ticketId: supportTicket.id, roomId: roomId }
                    });
                }
            }
        }).catch(err => this.logger.error(`AI Support generation failed: ${err.message}`));
    }

    // Send Push Notification
    try {
        const roomWithParticipants = await this.chatRoomsRepository.findOne({
            where: { id: roomId },
            relations: ['patient', 'specialist', 'consultation', 'consultation.patient', 'consultation.specialist']
        });

        if (roomWithParticipants) {
            const sender = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
            
            // If it's a support ticket, notify assigned admin or ALL admins if escalated
            if (supportTicket) {
                const senderName = sender.fullName || sender.email.split('@')[0];
                
                if (supportTicket.assignedAdmin && userId !== supportTicket.assignedAdmin.id) {
                    // Notify assigned admin
                    await this.notificationsService.sendToUser(supportTicket.assignedAdmin.id, {
                        title: `Support: ${senderName}`,
                        body: data.content,
                        type: 'CHAT_MESSAGE',
                        metadata: { roomId, chatId: roomId, senderName }
                    });
                } else if (supportTicket.status === SupportTicketStatus.ESCALATED && userId === supportTicket.user.id) {
                    // Notify ALL admins if escalated and message is from user
                    const admins = await this.dataSource.getRepository(User).createQueryBuilder('user')
                        .where("'ADMIN' = ANY(user.roles)")
                        .getMany();
                    
                    for (const admin of admins) {
                        if (admin.id !== userId) {
                            await this.notificationsService.sendToUser(admin.id, {
                                title: `Support (Escalated): ${senderName}`,
                                body: data.content,
                                type: 'CHAT_MESSAGE',
                                metadata: { roomId, chatId: roomId, senderName }
                            });
                        }
                    }
                } else if (userId !== supportTicket.user.id) {
                    // Notify user if message is from admin
                    await this.notificationsService.sendToUser(supportTicket.user.id, {
                        title: `Support Agent`,
                        body: data.content,
                        type: 'CHAT_MESSAGE',
                        metadata: { roomId, chatId: roomId, senderName: 'Support Agent' }
                    });
                }
                return savedMessage;
            }

            // Standard consultation chat logic...
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
