import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToMany,
  JoinTable,
  Index
} from 'typeorm';
import { Group } from './group.entity';

@Entity('permissions')
@Index(['resource', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  resource: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @ManyToMany(() => Group, group => group.permissions)
  @JoinTable({
    name: 'group_permissions',
    joinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' }
  })
  groups: Group[];
}
