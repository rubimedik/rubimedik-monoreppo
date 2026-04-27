import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ChatRoom } from '../chat/entities/chat-room.entity';
import { Message } from '../chat/entities/message.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { DonationMatch } from '../donations/entities/donation-match.entity';
import { SupportTicketStatus, SupportTicketCategory, ConsultationStatus, PayoutStatus, MessageType, UserRole } from '@repo/shared';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private supportTicketsRepository: Repository<SupportTicket>,
    @InjectRepository(ChatRoom)
    private chatRoomsRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async createTicket(userId: string, dto: CreateTicketDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const ticket = new SupportTicket();
      ticket.user = user;
      ticket.subject = dto.subject;
      ticket.description = dto.initialMessage;
      ticket.category = dto.category;
      ticket.status = SupportTicketStatus.AI_TRIAGE;

      if (dto.consultationId) {
        const consultation = await queryRunner.manager.findOne(Consultation, { 
            where: { id: dto.consultationId },
            relations: ['patient', 'specialist']
        });
        if (consultation) {
          ticket.relatedConsultation = consultation;
          
          // AUTOMATED DISPUTE FLOW
          if (dto.category === SupportTicketCategory.BILLING_DISPUTE || dto.category === SupportTicketCategory.CONSULTATION_DISPUTE) {
            consultation.status = ConsultationStatus.DISPUTED;
            consultation.payoutStatus = PayoutStatus.HELD;
            consultation.payoutNote = `Dispute filed by ${user.fullName || user.email}: ${dto.category}`;
            await queryRunner.manager.save(consultation);
          }
        }
      }

      if (dto.donationMatchId) {
        const donationMatch = await queryRunner.manager.findOne(DonationMatch, {
            where: { id: dto.donationMatchId },
            relations: ['donor', 'request', 'request.hospital']
        });
        if (donationMatch) {
            ticket.relatedDonation = donationMatch;
        }
      }

      // Create Chat Room
      const chatRoom = new ChatRoom();
      // We don't link patient/specialist directly here to distinguish from medical chats
      // Instead we use the one-to-one link from SupportTicket to ChatRoom
      await queryRunner.manager.save(chatRoom);
      ticket.chatRoom = chatRoom;

      const savedTicket = await queryRunner.manager.save(ticket);

      // Save initial message
      const message = new Message();
      message.chatRoom = chatRoom;
      message.sender = user;
      message.content = dto.initialMessage;
      message.type = MessageType.TEXT;
      await queryRunner.manager.save(message);

      await queryRunner.commitTransaction();

      // NOTIFY ALL ADMINS OF NEW TICKET
      const admins = await this.usersRepository.createQueryBuilder('user')
        .where("'ADMIN' = ANY(user.roles)")
        .getMany();
      
      const notificationsService = this.dataSource.getRepository(User); // Placeholder - usually injected
      // Note: We actually handle this in ChatService.saveMessage now since the initial message is saved above
      
      return savedTicket;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMyTickets(userId: string) {
    return this.supportTicketsRepository.find({
      where: { user: { id: userId } },
      relations: ['chatRoom'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllTickets() {
    return this.supportTicketsRepository.find({
      relations: ['user', 'assignedAdmin', 'chatRoom'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTicket(id: string) {
    const ticket = await this.supportTicketsRepository.findOne({
      where: { id },
      relations: ['user', 'assignedAdmin', 'chatRoom', 'relatedConsultation'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateTicket(id: string, dto: UpdateTicketDto) {
    const ticket = await this.getTicket(id);

    if (dto.status) {
        ticket.status = dto.status;
        
        // If admin resolves/closes, and there's a consultation in DISPUTE, handle it
        if ((dto.status === SupportTicketStatus.RESOLVED || dto.status === SupportTicketStatus.CLOSED) && ticket.relatedConsultation) {
            const consultation = ticket.relatedConsultation;
            if (consultation.payoutStatus === PayoutStatus.HELD) {
                consultation.payoutStatus = PayoutStatus.PENDING;
                if (consultation.status === ConsultationStatus.DISPUTED) {
                    consultation.status = ConsultationStatus.PENDING_PAYOUT;
                }
                consultation.payoutNote = `Issue marked as ${dto.status} by admin.`;
                await this.dataSource.getRepository(Consultation).save(consultation);
            }
        }
    }
    
    if (dto.adminId) {
      const admin = await this.usersRepository.findOne({ where: { id: dto.adminId } });
      if (!admin || !admin.roles.includes(UserRole.ADMIN)) {
        throw new BadRequestException('Invalid admin ID');
      }
      ticket.assignedAdmin = admin;
    }

    return this.supportTicketsRepository.save(ticket);
  }

  async resolveTicket(id: string, userId: string) {
    // Try finding by Ticket ID first, then by ChatRoom ID
    let ticket = await this.supportTicketsRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['relatedConsultation']
    });

    if (!ticket) {
        ticket = await this.supportTicketsRepository.findOne({
            where: { chatRoom: { id }, user: { id: userId } },
            relations: ['relatedConsultation']
        });
    }

    if (!ticket) throw new NotFoundException('Ticket not found');
    
    ticket.status = SupportTicketStatus.RESOLVED;

    if (ticket.relatedConsultation) {
        const consultation = ticket.relatedConsultation;
        // Release hold if it was held due to this issue
        if (consultation.payoutStatus === PayoutStatus.HELD) {
            consultation.payoutStatus = PayoutStatus.PENDING;
            if (consultation.status === ConsultationStatus.DISPUTED) {
                consultation.status = ConsultationStatus.PENDING_PAYOUT;
            }
            consultation.payoutNote = 'Issue resolved by user.';
            await this.dataSource.getRepository(Consultation).save(consultation);
        }
    }

    return this.supportTicketsRepository.save(ticket);
  }
}
