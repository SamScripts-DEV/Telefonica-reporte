import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tower } from '../../entities/tower.entity';
import { CreateTowerDto } from './dto/create-tower.dto';
import { UpdateTowerDto } from './dto/update-tower.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { RequestUser } from '../../common/interfaces/auth.interface';

@Injectable()
export class TowersService {
  constructor(
    @InjectRepository(Tower)
    private towerRepository: Repository<Tower>,
  ) {}

  async create(createTowerDto: CreateTowerDto): Promise<Tower> {
    const existingTower = await this.towerRepository.findOne({
      where: { name: createTowerDto.name },
    });

    if (existingTower) {
      throw new ConflictException('Tower name already exists');
    }

    const tower = this.towerRepository.create(createTowerDto);
    return this.towerRepository.save(tower);
  }

  async findAll(user?: RequestUser): Promise<{data: Tower[]}> {

    const queryBuilder = this.towerRepository.createQueryBuilder('tower')
      .leftJoinAndSelect('tower.users', 'users')
      .leftJoinAndSelect('tower.technicians', 'technicians')
      .leftJoinAndSelect('tower.forms', 'forms');
    
    // If user is not dev/superadmin, filter by their towers
    if (user && !['dev', 'superadmin'].includes(user.roleName)) {
      if (user.towerIds.length > 0) {
        queryBuilder.where('tower.id IN (:...towerIds)', { towerIds: user.towerIds });
      } else {
        queryBuilder.where('1 = 0'); // No towers accessible
      }
    }

    const [towers, total] = await queryBuilder
      .orderBy('tower.name', 'ASC')
      .getManyAndCount();

    return {
      data: towers,
    };
  }

  async findOne(id: number, user?: RequestUser): Promise<Tower> {
    const tower = await this.towerRepository.findOne({
      where: { id },
      relations: ['users', 'technicians', 'forms'],
    });

    if (!tower) {
      throw new NotFoundException('Tower not found');
    }

    // Check access permissions
    if (user && !['dev', 'superadmin'].includes(user.roleName)) {
      if (!user.towerIds.includes(id)) {
        throw new NotFoundException('Tower not found');
      }
    }

    return tower;
  }

  async update(id: number, updateTowerDto: UpdateTowerDto): Promise<Tower> {
    const tower = await this.findOne(id);

    if (updateTowerDto.name && updateTowerDto.name !== tower.name) {
      const existingTower = await this.towerRepository.findOne({
        where: { name: updateTowerDto.name },
      });

      if (existingTower) {
        throw new ConflictException('Tower name already exists');
      }
    }

    await this.towerRepository.update(id, updateTowerDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const tower = await this.findOne(id);
    await this.towerRepository.remove(tower);
  }

  async findByUser(userId: string): Promise<Tower[]> {
    return this.towerRepository
      .createQueryBuilder('tower')
      .innerJoin('tower.users', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
  }
}
