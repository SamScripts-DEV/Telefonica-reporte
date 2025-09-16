import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { FormResponse } from './form-response.entity';
import { Question } from './question.entity';
import { Technician } from './technician.entity';

@Entity('question_responses')
export class QuestionResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_response_id' })
  formResponseId: string;

  @Column({ name: 'question_id', nullable: true })
  questionId: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @ManyToOne(() => FormResponse, formResponse => formResponse.questionResponses)
  @JoinColumn({ name: 'form_response_id' })
  formResponse: FormResponse;

  @ManyToOne(() => Question, question => question.responses)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => Technician)
  @JoinColumn({ name: 'technician_id' })
  technician: Technician; // <-- relación con Technician
}
