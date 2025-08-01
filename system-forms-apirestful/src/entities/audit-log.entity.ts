import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne,
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  resource: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ name: 'data_before', type: 'jsonb', nullable: true })
  dataBefore: any;

  @Column({ name: 'data_after', type: 'jsonb', nullable: true })
  dataAfter: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
