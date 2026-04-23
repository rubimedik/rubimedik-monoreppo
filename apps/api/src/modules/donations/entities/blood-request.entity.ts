import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { UrgencyLevel, DonationStatus, DonationType } from '@repo/shared';
import { DonationMatch } from './donation-match.entity';

@Entity('blood_requests')
export class BloodRequest {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Urgent Blood Needed' })
  @Column({ nullable: true })
  title: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  hospital: User;

  @ApiProperty({ example: 'O+' })
  @Column()
  bloodType: string;

  @ApiProperty({ example: 1 })
  @Column({ default: 1 })
  units: number;

  @ApiProperty({ example: 0 })
  @Column({ default: 0 })
  unitsFulfilled: number;

  @ApiProperty({ example: 'Patient in critical condition' })
  @Column({ type: 'text', nullable: true })
  reason: string;

  @ApiProperty({ enum: UrgencyLevel })
  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
  })
  urgency: UrgencyLevel;

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

  @ApiProperty({ type: () => [DonationMatch], required: false })
  @OneToMany(() => DonationMatch, (match) => match.request)
  matches: DonationMatch[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
