import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ai_chats')
export class AiChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text' })
  response: string;

  @CreateDateColumn()
  createdAt: Date;
}
