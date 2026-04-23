import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('hospital_inventories')
@Unique(['hospital', 'bloodType'])
export class HospitalInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  hospital: User;

  @Column()
  bloodType: string;

  @Column({ default: 0 })
  units: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
