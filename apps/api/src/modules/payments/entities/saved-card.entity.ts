import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('saved_cards')
export class SavedCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User)
  user: User;

  @Column()
  authorizationCode: string;

  @Column()
  last4: string;

  @Column()
  expMonth: string;

  @Column()
  expYear: string;

  @Column()
  cardType: string;

  @Column()
  bank: string;

  @Column({ nullable: true })
  brand: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
