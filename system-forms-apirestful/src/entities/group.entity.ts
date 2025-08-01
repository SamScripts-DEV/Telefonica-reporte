import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToMany, 
  OneToMany 
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from './permission.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @ManyToMany(() => User, user => user.groups)
  users: User[];

  @ManyToMany(() => Permission, permission => permission.groups)
  permissions: Permission[];
}
