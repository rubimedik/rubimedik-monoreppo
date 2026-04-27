import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Appointment } from './appointment.entity';
import { SupportTicket } from '../../support/entities/support-ticket.entity';
import { ConsultationStatus, CancellationPolicy, PayoutStatus } from '@repo/shared';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  specialist: User;

  @ManyToOne(() => User)
  patient: User;

  @Column({
    type: 'enum',
    enum: ConsultationStatus,
    default: ConsultationStatus.UPCOMING,
  })
  status: ConsultationStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  specialistPayout: number;

  @Column({ type: 'text', nullable: true })
  symptoms?: string;

  @Column('simple-array', { nullable: true })
  attachments?: string[];

  @Column({ nullable: true })
  meetingLink?: string;

  @Column({ nullable: true })
  meetingAddress?: string;

  @Column({ nullable: true })
  consultationType?: string; // e.g. video, call, in-person

  @Column('jsonb', { nullable: true })
  patientFeedback?: any;

  @Column('jsonb', { nullable: true })
  specialistFeedback?: any;

  @Column({ nullable: true })
  prescriptionUrl?: string;

  @Column({ nullable: true })
  labRequestUrl?: string;

  @Column({ nullable: true })
  labReportUrl?: string;

  @Column({ nullable: true })
  medicalReportUrl?: string;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PENDING,
  })
  payoutStatus: PayoutStatus;

  @Column({ nullable: true })
  payoutNote?: string;

  @Column({ default: 0 })
  followUpCount: number;

  @Column({ default: 0 })
  followUpUsed: number;

  @Column({ default: 30 })
  followUpWindowDays: number;

  @Column({
    type: 'enum',
    enum: CancellationPolicy,
    default: CancellationPolicy.H24,
  })
  cancellationPolicy: CancellationPolicy;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  chatClosesAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  payoutReleasesAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'int', default: 30 })
  duration: number; // in minutes

  @Column('jsonb', { nullable: true })
  aiSummary: any; // { diagnosis, advice, prescription, followUp }

  @Column({ nullable: true })
  chatLockedBy: string; // 'timeout' | 'specialist' | 'admin' | 'dispute'

  @OneToMany(() => Appointment, (appointment) => appointment.consultation)
  appointments: Appointment[];

  @OneToMany(() => SupportTicket, (ticket) => ticket.relatedConsultation)
  supportTickets: SupportTicket[];

  @Column({ default: false })
  isPatientCheckedIn: boolean;

  @Column({ default: false })
  isSpecialistCheckedIn: boolean;

  @Column({ default: false })
  checkInReminderSent: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
