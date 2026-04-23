import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';

@Entity('wallets')
export class Wallet {
  @ApiProperty({ example: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 1000.50 })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number;

  @ApiProperty({ example: 100 })
  @Column({ type: 'int', default: 0 })
  points: number;

  @ApiProperty({ example: 'Wema Bank', required: false })
  @Column({ nullable: true })
  bankName: string;

  @ApiProperty({ example: '1234567890', required: false })
  @Column({ nullable: true })
  accountNumber: string;

  @ApiProperty({ example: 'Rubimedik / John Doe', required: false })
  @Column({ nullable: true })
  accountName: string;

  @ApiProperty({ example: 'CUS_123', required: false })
  @Column({ nullable: true })
  customerCode: string;

  @ApiProperty({ type: () => User })
  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn()
  user: User;

  @ApiProperty({ type: () => [Transaction], required: false })
  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  ledger: Transaction[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
