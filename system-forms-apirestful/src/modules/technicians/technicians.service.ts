import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Technician } from '../../entities/technician.entity';
import { Tower } from '../../entities/tower.entity';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class TechniciansService {
  constructor(
    @InjectRepository(Technician)
    private technicianRepository: Repository<Technician>,
    @InjectRepository(Tower)
    private towerRepository: Repository<Tower>,
    private usersService: UsersService
  ) { }



  async findAll(user?: RequestUser): Promise<{data: Technician[]}> {


    const queryBuilder = this.technicianRepository
      .createQueryBuilder('technician')
      .leftJoinAndSelect('technician.tower', 'tower')
      .leftJoinAndSelect('technician.evaluators', 'evaluators');

    // Filter by user's towers if not dev/superadmin
    if (user && !['dev', 'superadmin'].includes(user.roleName)) {
      if (user.towerIds.length > 0) {
        queryBuilder.where('technician.towerId IN (:...towerIds)', { towerIds: user.towerIds });
      } else {
        queryBuilder.where('1 = 0'); // No access to any technicians
      }
    }

    const [technicians, total] = await queryBuilder
      .orderBy('technician.name', 'ASC')
      .getManyAndCount();

    return {
      data: technicians,
    };
  }

  async findOne(id: string, user?: RequestUser): Promise<Technician> {
    const queryBuilder = this.technicianRepository
      .createQueryBuilder('technician')
      .leftJoinAndSelect('technician.tower', 'tower')
      .leftJoinAndSelect('technician.evaluators', 'evaluators')
      .where('technician.id = :id', { id });

    // Filter by user's towers if not dev/superadmin
    if (user && !['dev', 'superadmin'].includes(user.roleName)) {
      if (user.towerIds.length > 0) {
        queryBuilder.andWhere('technician.towerId IN (:...towerIds)', { towerIds: user.towerIds });
      } else {
        queryBuilder.andWhere('1 = 0'); // No access
      }
    }

    const technician = await queryBuilder.getOne();

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    return technician;
  }

  async create(createTechnicianDto: CreateTechnicianDto): Promise<Technician> {
    const { towerId, ...technicianData } = createTechnicianDto;

    // Validar torre
    if (towerId) {
      const tower = await this.towerRepository.findOne({ where: { id: towerId } });
      if (!tower) throw new BadRequestException('Invalid tower ID');
      console.log(`[TECHNICIAN] Torre encontrada:`, tower);
    }

    // Crear técnico
    const technician = this.technicianRepository.create({
      ...technicianData,
      towerId,
    });
    const savedTechnician = await this.technicianRepository.save(technician);
    console.log(`[TECHNICIAN] Técnico creado:`, savedTechnician);

    // Sincronizar evaluadores (fuera de la transacción)
    console.log(`[TECHNICIAN] Ejecutando sincronización de evaluadores...`);
    const syncResult = await this.usersService.syncAllEvaluatorTechnicianMappings();
    console.log(`[TECHNICIAN] Resultado de sincronización:`, syncResult);

    // Verificar técnico en base de datos
    const checkTechnician = await this.technicianRepository.findOne({ where: { id: savedTechnician.id } });
    console.log(`[TECHNICIAN] Técnico verificado en DB:`, checkTechnician);

    return savedTechnician;
  }

  async update(id: string, updateTechnicianDto: UpdateTechnicianDto, user?: RequestUser): Promise<Technician> {
    const technician = await this.findOne(id, user);

    // Validate tower if provided
    if (updateTechnicianDto.towerId) {
      const tower = await this.towerRepository.findOne({
        where: { id: updateTechnicianDto.towerId },
      });
      if (!tower) {
        throw new BadRequestException('Invalid tower ID');
      }
    }

    await this.technicianRepository.update(id, updateTechnicianDto);
    return this.findOne(id, user);
  }

  async remove(id: string, user?: RequestUser): Promise<void> {
    const technician = await this.findOne(id, user);
    await this.technicianRepository.remove(technician);
  }

  async findByTower(towerId: number): Promise<Technician[]> {
    return this.technicianRepository.find({
      where: { towerId },
      relations: ['tower', 'evaluators'],
      order: { name: 'ASC' },
    });
  }

  async assignEvaluator(technicianId: string, evaluatorId: string): Promise<Technician> {
    const technician = await this.technicianRepository.findOne({
      where: { id: technicianId },
      relations: ['evaluators'],
    });

    if (!technician) {
      throw new NotFoundException('Technician not found');
    }

    // Add evaluator if not already assigned
    const isAlreadyAssigned = technician.evaluators.some(evaluator => evaluator.id === evaluatorId);
    if (!isAlreadyAssigned) {
      const evaluator = { id: evaluatorId } as any;
      technician.evaluators.push(evaluator);
      await this.technicianRepository.save(technician);
    }

    return this.findOne(technicianId);
  }
}
