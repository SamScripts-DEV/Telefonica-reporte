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

  @Column({ name: 'is_anonymous', default: false })
  isAnonymous: boolean;

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
