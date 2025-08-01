import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne,
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { User } from './user.entity';

@Entity('question_history')
export class QuestionHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'changed_by', nullable: true })
  changedBy: string;

  @Column({ name: 'old_text', type: 'text', nullable: true })
  oldText: string;

  @Column({ name: 'new_text', type: 'text', nullable: true })
  newText: string;

  @Column({ name: 'old_options', type: 'jsonb', nullable: true })
  oldOptions: any;

  @Column({ name: 'new_options', type: 'jsonb', nullable: true })
  newOptions: any;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changedByUser: User;
}
