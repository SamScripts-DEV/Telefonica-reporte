import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from '../../entities/group.entity';
import { Permission } from '../../entities/permission.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const { permissionIds, ...groupData } = createGroupDto;

    const existingGroup = await this.groupRepository.findOne({
      where: { name: groupData.name },
    });

    if (existingGroup) {
      throw new ConflictException('Group name already exists');
    }

    const group = this.groupRepository.create(groupData);
    const savedGroup = await this.groupRepository.save(group);

    if (permissionIds && permissionIds.length > 0) {
      await this.assignPermissionsToGroup(savedGroup.id, permissionIds);
    }

    return this.findOne(savedGroup.id);
  }

  async findAll(): Promise<Group[]> {
    return this.groupRepository.find({
      relations: ['users', 'permissions'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['users', 'permissions'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const { permissionIds, ...updateData } = updateGroupDto;
    const group = await this.findOne(id);

    if (updateData.name && updateData.name !== group.name) {
      const existingGroup = await this.groupRepository.findOne({
        where: { name: updateData.name },
      });

      if (existingGroup) {
        throw new ConflictException('Group name already exists');
      }
    }

    await this.groupRepository.update(id, updateData);

    if (permissionIds !== undefined) {
      await this.assignPermissionsToGroup(id, permissionIds);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
  }

  async assignPermissionsToGroup(groupId: number, permissionIds: number[]): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['permissions'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (permissionIds.length > 0) {
      const permissions = await this.permissionRepository.findBy({
        id: In(permissionIds),
      });

      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException('Some permission IDs are invalid');
      }

      group.permissions = permissions;
    } else {
      group.permissions = [];
    }

    await this.groupRepository.save(group);
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const groups = await this.groupRepository
      .createQueryBuilder('group')
      .innerJoin('group.users', 'user')
      .leftJoinAndSelect('group.permissions', 'permissions')
      .where('user.id = :userId', { userId })
      .getMany();

    const permissions: Permission[] = [];
    const permissionIds = new Set<number>();

    for (const group of groups) {
      for (const permission of group.permissions) {
        if (!permissionIds.has(permission.id)) {
          permissions.push(permission);
          permissionIds.add(permission.id);
        }
      }
    }

    return permissions;
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.resource === resource && p.action === action);
  }

  async seedDefaultGroups(): Promise<void> {
    const defaultGroups = [
      {
        name: 'Developers',
        permissions: ['*'] // All permissions
      },
      {
        name: 'Project Managers',
        permissions: [
          'users.read', 'users.create', 'users.update',
          'towers.read', 'towers.create', 'towers.update',
          'technicians.read', 'technicians.create', 'technicians.update',
          'forms.read', 'forms.create', 'forms.update', 'forms.view_responses'
        ]
      },
      {
        name: 'Team Leaders',
        permissions: [
          'users.read',
          'towers.read',
          'technicians.read', 'technicians.create', 'technicians.update',
          'forms.read', 'forms.create', 'forms.update', 'forms.view_responses'
        ]
      },
      {
        name: 'Evaluators',
        permissions: [
          'towers.read',
          'technicians.read',
          'forms.read', 'forms.submit'
        ]
      }
    ];

    for (const groupData of defaultGroups) {
      const exists = await this.groupRepository.findOne({
        where: { name: groupData.name }
      });
      
      if (!exists) {
        const group = this.groupRepository.create({ name: groupData.name });
        await this.groupRepository.save(group);
      }
    }
  }
}
