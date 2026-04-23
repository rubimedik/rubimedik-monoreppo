import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { BloodRequest } from './blood-request.entity';

@Entity('hospital_feedbacks')
export class HospitalFeedback {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  donor: User;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  hospital: User;

  @ApiProperty({ type: () => BloodRequest, required: false })
  @ManyToOne(() => BloodRequest, { nullable: true })
  request: BloodRequest;

  @ApiProperty({ example: 5 })
  @Column()
  rating: number;

  @ApiProperty({ example: 'Great service' })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isAnonymous: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
