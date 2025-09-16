import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Technician } from "./technician.entity";

@Entity('evaluator_technician_map')
export class EvaluatorTechnicianMap {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('uuid')
    evaluatorId: string;

    @Column('uuid')
    technicianId: string;

    @ManyToOne(() => User)
    @JoinColumn({name: 'evaluator_id'})
    evaluator: User;

    @ManyToOne(() => Technician)
    @JoinColumn({name: 'technician_id'})
    technician: Technician;

}