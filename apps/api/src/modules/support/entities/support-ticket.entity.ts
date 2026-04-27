import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatRoom } from '../../chat/entities/chat-room.entity';
import { Consultation } from '../../consultations/entities/consultation.entity';
import { DonationMatch } from '../../donations/entities/donation-match.entity';
import { SupportTicketStatus, SupportTicketCategory } from '@repo/shared';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({
    type: 'enum',
    enum: SupportTicketCategory,
    default: SupportTicketCategory.GENERAL_INQUIRY,
  })
  category: SupportTicketCategory;

  @Column()
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SupportTicketStatus,
    default: SupportTicketStatus.AI_TRIAGE,
  })
  status: SupportTicketStatus;

  @ManyToOne(() => User, { nullable: true })
  assignedAdmin: User;

  @ManyToOne(() => Consultation, { nullable: true })
  relatedConsultation: Consultation;

  @ManyToOne(() => DonationMatch, { nullable: true })
  relatedDonation: DonationMatch;

  @OneToOne(() => ChatRoom, { cascade: true })
  @JoinColumn()
  chatRoom: ChatRoom;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
