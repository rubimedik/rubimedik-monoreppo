import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('patient_profiles')
export class PatientProfile {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Healthy', required: false })
  @Column({ nullable: true })
  healthCondition: string;

  @ApiProperty({ example: 'No allergies', required: false })
  @Column({ type: 'text', nullable: true })
  medicalNotes: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ example: 'Lagos', required: false })
  @Column({ nullable: true })
  city: string;

  @ApiProperty({ example: 'Lagos State', required: false })
  @Column({ nullable: true })
  state: string;

  @ApiProperty({ example: 6.5244, required: false })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @ApiProperty({ example: 3.3792, required: false })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (user) => user.patientProfile)
  @JoinColumn()
  user: User;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
