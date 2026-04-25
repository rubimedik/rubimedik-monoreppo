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
import { User } from '../../users/entities/user.entity';

@Entity('hospital_profiles')
export class HospitalProfile {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'General Hospital' })
  @Column()
  hospitalName: string;

  @ApiProperty({ example: '123 Medical Way', required: false })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ example: 'LIC12345', required: false })
  @Column({ nullable: true })
  licenseNumber: string;

  @ApiProperty({ example: 'https://example.com/doc.pdf', required: false })
  @Column({ nullable: true })
  documentUrl: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @Column({ nullable: true })
  phoneNumber: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  isApproved: boolean;

  @ApiProperty({ example: false })
  @Column({ default: false })
  termsAccepted: boolean;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  unitsReceived: number;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  reservedUnits: number;

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (user) => user.hospitalProfile)
  @JoinColumn()
  user: User;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
