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
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, towerIds, groupIds, ...userData } = createUserDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email },
    });

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

    // Assign towers if provided
    if (towerIds && towerIds.length > 0) {
      await this.assignTowersToUser(savedUser.id, towerIds);
    }

    // Assign groups if provided
    if (groupIds && groupIds.length > 0) {
      await this.assignGroupsToUser(savedUser.id, groupIds);
    }

    return this.findOne(savedUser.id);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      relations: ['role', 'towers', 'groups'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
    await this.userRepository.update(id, { isActive: false });
  }

  async assignTowersToUser(userId: string, towerIds: number[]): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['towers'],
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
    } else {
      user.towers = [];
    }

    await this.userRepository.save(user);
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
}
