import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  ManyToMany, 
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { Tower } from './tower.entity';
import { User } from './user.entity';

@Entity('technicians')
export class Technician {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'tower_id', nullable: true })
  towerId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Tower, tower => tower.technicians)
  @JoinColumn({ name: 'tower_id' })
  tower: Tower;

  @ManyToMany(() => User, user => user.assignedTechnicians)
  evaluators: User[];
}
