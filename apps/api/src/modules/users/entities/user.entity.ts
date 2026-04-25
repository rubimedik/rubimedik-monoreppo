import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne, OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@repo/shared';
import { SpecialistProfile } from '../../specialists/entities/specialist-profile.entity';
import { HospitalProfile } from '../../hospitals/entities/hospital-profile.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { PatientProfile } from './patient-profile.entity';

@Entity('users')
export class User {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @Column({ nullable: true })
  fullName?: string;

  @ApiProperty({ example: 'John', required: false })
  @Column({ nullable: true })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @Column({ nullable: true })
  lastName?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @Column({ nullable: true })
  avatarUrl?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({ example: 'O+', required: false })
  @Column({ nullable: true })
  bloodGroup?: string;

  @ApiProperty({ example: 'AA', required: false })
  @Column({ nullable: true })
  genotype?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @ApiProperty({ enum: UserRole, isArray: true })
  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.PATIENT],
  })
  roles: UserRole[];

  @ApiProperty({ enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  activeRole: UserRole;

  @ApiProperty({ example: 'google-id', required: false })
  @Column({ nullable: true })
  googleId?: string;

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true, select: false })
  twoFactorSecret?: string;

  @ApiProperty({ example: 'REF123' })
  @Column({ unique: true })
  referralCode: string;

  @ApiProperty({ example: 'uuid-of-referrer', required: false })
  @Column({ nullable: true })
  referredById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referredById' })
  referredBy?: User;

  @ApiProperty({ type: () => PatientProfile, required: false })
  @OneToOne(() => PatientProfile, (profile) => profile.user, { cascade: true })
  patientProfile?: PatientProfile;

  @OneToOne(() => SpecialistProfile, (profile) => profile.user, { cascade: true })
  specialistProfile?: SpecialistProfile;

  @ApiProperty({ type: () => HospitalProfile, required: false })
  @OneToOne(() => HospitalProfile, (profile) => profile.user, { cascade: true })
  hospitalProfile?: HospitalProfile;

  @ApiProperty({ type: () => Wallet })
  @OneToOne(() => Wallet, (wallet) => wallet.user, { cascade: true })
  wallet: Wallet;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'float', default: 70 })
  trustScore: number; // Patients start at 70, Specialists start at 60

  @ApiProperty({ example: 5 })
  @Column({ default: 5 })
  donationGoal: number;

  @Column('jsonb', { nullable: true })
  donorInsights: any; // { burnoutWarning, rarityMessage, lastImpactSummary }

  @Column({ default: true })
  pushAppointments: boolean;

  @Column({ default: true })
  pushChat: boolean;

  @Column({ default: false })
  pushPromotions: boolean;

  @Column({ default: true })
  emailReports: boolean;

  @Column({ default: true })
  emailSecurity: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
