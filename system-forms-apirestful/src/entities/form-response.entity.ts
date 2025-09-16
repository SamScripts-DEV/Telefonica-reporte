import { QuestionResponse } from './question-response.entity';
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
import { User } from './user.entity';


@Entity('form_responses')
export class FormResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_id' })
  formId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  // ⭐ CAMPO PARA IDENTIFICAR EL PERÍODO EVALUADO
  // Para formularios periódicos: "2025-09" (septiembre 2025)
  // Para formularios single: null
  @Column({ name: 'evaluation_period', nullable: true })
  evaluationPeriod: string;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @ManyToOne(() => Form, form => form.responses)
  @JoinColumn({ name: 'form_id' })
  form: Form;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => QuestionResponse, response => response.formResponse)
  questionResponses: QuestionResponse[];
}
