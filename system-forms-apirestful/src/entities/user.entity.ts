import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  ManyToMany, 
  JoinTable, 
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { Role } from './role.entity';
import { Tower } from './tower.entity';
import { Group } from './group.entity';
import { Technician } from './technician.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({ name: 'role_id', nullable: true })
  roleId: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToMany(() => Tower, tower => tower.users)
  @JoinTable({
    name: 'user_tower_map',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tower_id', referencedColumnName: 'id' }
  })
  towers: Tower[];

  @ManyToMany(() => Group, group => group.users)
  @JoinTable({
    name: 'user_groups',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' }
  })
  groups: Group[];

  @ManyToMany(() => Technician, technician => technician.evaluators)
  @JoinTable({
    name: 'evaluator_technician_map',
    joinColumn: { name: 'evaluator_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'technician_id', referencedColumnName: 'id' }
  })
  assignedTechnicians: Technician[];
}
