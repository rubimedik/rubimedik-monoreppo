import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BloodRequest } from './blood-request.entity';
import { User } from '../../users/entities/user.entity';
import { DonationStatus, DonationType } from '@repo/shared';

@Entity('donation_matches')
export class DonationMatch {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => BloodRequest })
  @ManyToOne(() => BloodRequest, (request) => request.matches)
  request: BloodRequest;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  donor: User;

  @ApiProperty({ enum: DonationStatus })
  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.PENDING,
  })
  status: DonationStatus;

  @ApiProperty({ enum: DonationType })
  @Column({
    type: 'enum',
    enum: DonationType,
    default: DonationType.WHOLE_BLOOD,
  })
  donationType: DonationType;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isAnonymous: boolean;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int', default: 1 })
  units: number;

  @ApiProperty({ example: '2026-05-20T10:00:00Z', required: false })
  @Column({ nullable: true })
  scheduledDate?: Date;

  @ApiProperty({ example: '2026-05-20T11:00:00Z', required: false })
  @Column({ nullable: true })
  donatedAt?: Date;

  @ApiProperty({ example: '2026-05-20T12:00:00Z', required: false })
  @Column({ nullable: true })
  verifiedAt?: Date;

  @ApiProperty({ example: 'Hospital too busy', required: false })
  @Column({ nullable: true })
  declineReason?: string;

  @Column({ default: false })
  isDonorCheckedIn: boolean;

  @Column({ default: false })
  isHospitalCheckedIn: boolean;

  @Column({ default: false })
  checkInReminderSent: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
