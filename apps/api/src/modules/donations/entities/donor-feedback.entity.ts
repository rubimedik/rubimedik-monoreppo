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
import { DonationMatch } from './donation-match.entity';

@Entity('donor_feedbacks')
export class DonorFeedback {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  hospital: User;

  @ApiProperty({ type: () => User })
  @ManyToOne(() => User)
  donor: User;

  @ApiProperty({ type: () => DonationMatch })
  @ManyToOne(() => DonationMatch)
  match: DonationMatch;

  @ApiProperty({ example: 5 })
  @Column()
  rating: number;

  @ApiProperty({ example: 'Prompt and healthy' })
  @Column({ type: 'text' })
  comment: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
