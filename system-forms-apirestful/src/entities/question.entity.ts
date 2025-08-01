import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany,
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { Form } from './form.entity';
import { QuestionResponse } from './question-response.entity';

export enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SCALE = 'scale',
  TEXTAREA = 'textarea'
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_id' })
  formId: string;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({ 
    name: 'question_type',
    type: 'enum',
    enum: QuestionType
  })
  questionType: QuestionType;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ nullable: true })
  position: number;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Form, form => form.questions)
  @JoinColumn({ name: 'form_id' })
  form: Form;

  @OneToMany(() => QuestionResponse, response => response.question)
  responses: QuestionResponse[];
}
