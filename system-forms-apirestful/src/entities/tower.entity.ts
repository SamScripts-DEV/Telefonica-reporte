import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { User } from './user.entity';
import { Technician } from './technician.entity';
import { Form } from './form.entity';

@Entity('towers')
export class Tower {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @ManyToMany(() => User, user => user.towers)
  users: User[];

  @OneToMany(() => Technician, technician => technician.tower)
  technicians: Technician[];

  @ManyToMany(() => Form, form => form.towers)
  forms: Form[];
}
