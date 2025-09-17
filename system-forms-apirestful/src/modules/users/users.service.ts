import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Tower } from '../../entities/tower.entity';
import { Role } from '../../entities/role.entity';
import { Group } from '../../entities/group.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { Technician } from 'src/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tower)
    private towerRepository: Repository<Tower>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Technician)
    private technicianRepository: Repository<Technician>
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, towerIds, groupIds, ...userData } = createUserDto;
    console.log("Creating user with data:", createUserDto);


    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });
    console.log("Existing user check:", existingUser);


    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Validate role if provided
    if (userData.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: userData.roleId },
      });
      if (!role) {
        throw new BadRequestException('Invalid role ID');
      }
    }

    // Create user
    const user = this.userRepository.create({
      ...userData,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(user);

    if (towerIds && Array.isArray(towerIds) && towerIds.length > 0) {
      console.log("Assigning towers to user:", towerIds);
      await this.assignTowersToUser(savedUser.id, towerIds);
    } else {
      console.log("No towers to assign - towerIds:", towerIds);
    }

    // Assign groups if provided
    if (groupIds && groupIds.length > 0) {
      await this.assignGroupsToUser(savedUser.id, groupIds);
    }

    return this.findOne(savedUser.id);
  }

  async findAll(): Promise<{ data: User[] }> {

    const [users, total] = await this.userRepository.findAndCount({
      relations: ['role', 'towers', 'groups'],
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'towers', 'groups', 'assignedTechnicians'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, towerIds, groupIds, ...updateData } = updateUserDto;

    const user = await this.findOne(id);

    // Hash password if provided
    if (password) {
      updateData['passwordHash'] = await bcrypt.hash(password, 10);
    }

    // Validate role if provided
    if (updateData.roleId) {
      const role = await this.roleRepository.findOne({
        where: { id: updateData.roleId },
      });
      if (!role) {
        throw new BadRequestException('Invalid role ID');
      }
    }

    // Update user data
    await this.userRepository.update(id, updateData);

    // Update towers if provided
    if (towerIds !== undefined) {
      await this.assignTowersToUser(id, towerIds);
    }

    // Update groups if provided
    if (groupIds !== undefined) {
      await this.assignGroupsToUser(id, groupIds);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.update(id, { isActive: false });
  }

  async assignTowersToUser(userId: string, towerIds: number[]): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['towers', 'assignedTechnicians', 'role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (towerIds.length > 0) {
      const towers = await this.towerRepository.findBy({
        id: In(towerIds),
      });

      if (towers.length !== towerIds.length) {
        throw new BadRequestException('Some tower IDs are invalid');
      }

      user.towers = towers;

      if (this.isEvaluatorRole(user.role?.name)) {
        await this.autoAssignTechniciansToEvaluator(user, towerIds)
      }

    } else {
      user.towers = [];

      if (this.isEvaluatorRole(user.role?.name)) {
        user.assignedTechnicians = [];
      }
    }

    await this.userRepository.save(user);
  }

  //Metodos Helper
  private isEvaluatorRole(roleName?: string): boolean {
    return roleName === 'client';
  }

  private async autoAssignTechniciansToEvaluator(user: User, towerIds: number[]): Promise<void> {
    const techniciansInTowers = await this.technicianRepository.find({
      where: { towerId: In(towerIds) },
    })

    user.assignedTechnicians = techniciansInTowers
    console.log(`Auto-assigning ${techniciansInTowers.length} technicians to evaluator ${user.email}`);

  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'towers', 'groups'],
    });
  }

  async assignGroupsToUser(userId: string, groupIds: number[]): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['groups'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (groupIds.length > 0) {
      const groups = await this.groupRepository.findBy({
        id: In(groupIds),
      });

      if (groups.length !== groupIds.length) {
        throw new BadRequestException('Some group IDs are invalid');
      }

      user.groups = groups;
    } else {
      user.groups = [];
    }

    await this.userRepository.save(user);
  }


  //Sincornizar asignaciones para usuarios existentes
  async syncAllEvaluatorTechnicianMappings(): Promise<{ processed: number; updated: number; skipped: number }> {
    const stats = { processed: 0, updated: 0, skipped: 0 };

    const evaluators = await this.userRepository.find({
      relations: ['role', 'towers', 'assignedTechnicians'],
      where: { isActive: true }
    });

    console.log(`[SYNC] Evaluadores encontrados: ${evaluators.length}`);

    for (const user of evaluators) {
      stats.processed++;

      if (!this.isEvaluatorRole(user.role?.name)) {
        stats.skipped++;
        console.log(`[SYNC] Usuario omitido (no es client): ${user.email} (${user.role?.name})`);
        continue;
      }

      if (user.towers && user.towers.length > 0) {
        const towerIds = user.towers.map(t => t.id);
        console.log(`[SYNC] Usuario ${user.email} tiene torres: ${towerIds}`);

        const expectedTechnicians = await this.technicianRepository.find({
          where: { towerId: In(towerIds) }
        });

        console.log(`[SYNC] Técnicos esperados para ${user.email}:`, expectedTechnicians.map(t => t.id));

        const currentTechnicianIds = user.assignedTechnicians?.map(t => t.id) || [];
        const expectedTechnicianIds = expectedTechnicians.map(t => t.id);

        const needsUpdate =
          currentTechnicianIds.length !== expectedTechnicianIds.length ||
          !expectedTechnicianIds.every(id => currentTechnicianIds.includes(id));

        if (needsUpdate) {
          user.assignedTechnicians = expectedTechnicians;
          await this.userRepository.save(user);
          stats.updated++;
          console.log(`[SYNC] Técnicos asignados a ${user.email}:`, expectedTechnicians.map(t => t.id));
        } else {
          console.log(`[SYNC] Técnicos ya actualizados para ${user.email}`);
        }
      } else {
        console.log(`[SYNC] Usuario ${user.email} no tiene torres asignadas`);
      }
    }

    console.log(`[SYNC] Stats:`, stats);
    return stats;
  }

  async getUserEvaluationStatus(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'towers', 'assignedTechnicians']
    });

    if (!user || !this.isEvaluatorRole(user.role?.name)) {
      return { isEvaluator: false }
    }

    const towerIds = user.towers?.map(t => t.id) || [];
    const expectedTechnicians = towerIds.length > 0
      ? await this.technicianRepository.find({
        where: {
          towerId: In(towerIds)
        }
      })
      : [];

    return {
      isEvaluator: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      towers: user.towers || [],
      technicians: {
        assigned: user.assignedTechnicians || [],
        expected: expectedTechnicians,
        count: (user.assignedTechnicians || []).length
      }
    }




  }



}
