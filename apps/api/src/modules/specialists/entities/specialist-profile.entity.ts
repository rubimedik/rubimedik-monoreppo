import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('specialist_profiles')
export class SpecialistProfile {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Cardiology' })
  @Column()
  specialty: string;

  @ApiProperty({ example: 'LIC98765' })
  @Column()
  licenseNumber: string;

  @ApiProperty({ example: [], isArray: true, required: false })
  @Column('jsonb', { nullable: true })
  consultationPackages: any[];

  @ApiProperty({ example: {}, required: false })
  @Column('jsonb', { nullable: true })
  availabilitySlots: any;

  @ApiProperty({ example: 'https://example.com/cert.pdf', required: false })
  @Column({ nullable: true })
  certificationUrl: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty({ example: 5, required: false })
  @Column({ type: 'int', nullable: true })
  yearsOfExperience: number;

  @ApiProperty({ example: 'Lagos, Nigeria', required: false })
  @Column({ nullable: true })
  location: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isApproved: boolean;

  @ApiProperty({ example: 'Experienced cardiologist', required: false })
  @Column({ type: 'text', nullable: true })
  bio: string;

  @ApiProperty({ example: 'Bank of America', required: false })
  @Column({ nullable: true })
  bankName: string;

  @ApiProperty({ example: '058', required: false })
  @Column({ nullable: true })
  bankCode: string;

  @ApiProperty({ example: '1234567890', required: false })
  @Column({ nullable: true })
  accountNumber: string;

  @ApiProperty({ example: 'Dr. John Doe', required: false })
  @Column({ nullable: true })
  accountName: string;

  @ApiProperty({ example: [], isArray: true, required: false })
  @Column('jsonb', { default: [] })
  reviews: any[];

  @ApiProperty({ example: 0 })
  @Column({ type: 'float', default: 0 })
  rating: number;

  @ApiProperty({ type: () => User })
  @Index()
  @OneToOne(() => User, (user) => user.specialistProfile)
  @JoinColumn()
  user: User;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
