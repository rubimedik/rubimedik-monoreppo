import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Consultation } from './consultation.entity';
import { AppointmentType, ConsultationStatus } from '@repo/shared';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Consultation, (consultation) => consultation.appointments)
  consultation: Consultation;

  @Column()
  scheduledAt: Date;

  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.INITIAL,
  })
  type: AppointmentType;

  @Column({
    type: 'enum',
    enum: ConsultationStatus,
    default: ConsultationStatus.UPCOMING,
  })
  status: ConsultationStatus;

  @Column({ type: 'int', default: 30 })
  duration: number; // in minutes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
