import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ReferralStatus, UrgencyLevel } from '@repo/shared';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  specialist: User;

  @ManyToOne(() => User)
  patient: User;

  @ManyToOne(() => User)
  hospital: User;

  @Column('text')
  reason: string;

  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
  })
  urgency: UrgencyLevel;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.CREATED,
  })
  status: ReferralStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
