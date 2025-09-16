import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
  JoinColumn,
  JoinTable
} from 'typeorm';
import { User } from './user.entity';
import { Technician } from './technician.entity';
import { Tower } from './tower.entity';
import { Question } from './question.entity';
import { FormResponse } from './form-response.entity';

export enum FormStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed'
}

export enum FormType {
  SINGLE = 'single',
  PERIODIC = 'periodic'

}

@Entity('forms')
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: FormStatus,
    default: FormStatus.DRAFT
  })
  status: FormStatus;

  @Column({
    type: 'enum',
    enum: FormType,
    default: FormType.SINGLE
  })
  type: FormType;

  @Column({ name: 'is_anonymous', default: false })
  isAnonymous: boolean;

  // ⭐ CAMPOS PARA FORMULARIOS PERIÓDICOS
  // Solo se usan cuando type = PERIODIC

  @Column({ name: 'start_day', nullable: true })
  startDay: number; // Día que se abre (27)

  @Column({ name: 'end_day', nullable: true })
  endDay: number; // Día que se cierra (5)

  @Column({ name: 'auto_activate', default: false })
  autoActivate: boolean; // Se activa automáticamente

  @Column({ name: 'current_period', nullable: true })
  currentPeriod: string; // "2025-09" - El período actual activo

  @Column({ name: 'period_start_date', nullable: true })
  periodStartDate: Date; // Cuándo se abrió este período

  @Column({ name: 'period_end_date', nullable: true })
  periodEndDate: Date; // Cuándo se cierra este período

  //------------------------------------------------

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'technician_id', nullable: true })
  technicianId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => Technician)
  @JoinColumn({ name: 'technician_id' })
  technician: Technician;

  @ManyToMany(() => Tower, tower => tower.forms)
  @JoinTable({
    name: 'form_tower_map',
    joinColumn: { name: 'form_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tower_id', referencedColumnName: 'id' }
  })
  towers: Tower[];

  @OneToMany(() => Question, question => question.form)
  questions: Question[];

  @OneToMany(() => FormResponse, response => response.form)
  responses: FormResponse[];
}
