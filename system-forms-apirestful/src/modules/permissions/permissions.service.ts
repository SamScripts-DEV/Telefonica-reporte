import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const existingPermission = await this.permissionRepository.findOne({
      where: { 
        resource: createPermissionDto.resource,
        action: createPermissionDto.action
      },
    });

    if (existingPermission) {
      throw new ConflictException('Permission already exists');
    }

    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      relations: ['groups'],
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['groups'],
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    if (updatePermissionDto.resource || updatePermissionDto.action) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { 
          resource: updatePermissionDto.resource || permission.resource,
          action: updatePermissionDto.action || permission.action
        },
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException('Permission combination already exists');
      }
    }

    await this.permissionRepository.update(id, updatePermissionDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { resource, action },
      relations: ['groups'],
    });
  }

  async seedDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // Users permissions
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      
      // Roles permissions
      { resource: 'roles', action: 'create' },
      { resource: 'roles', action: 'read' },
      { resource: 'roles', action: 'update' },
      { resource: 'roles', action: 'delete' },
      
      // Towers permissions
      { resource: 'towers', action: 'create' },
      { resource: 'towers', action: 'read' },
      { resource: 'towers', action: 'update' },
      { resource: 'towers', action: 'delete' },
      
      // Technicians permissions
      { resource: 'technicians', action: 'create' },
      { resource: 'technicians', action: 'read' },
      { resource: 'technicians', action: 'update' },
      { resource: 'technicians', action: 'delete' },
      
      // Forms permissions
      { resource: 'forms', action: 'create' },
      { resource: 'forms', action: 'read' },
      { resource: 'forms', action: 'update' },
      { resource: 'forms', action: 'delete' },
      { resource: 'forms', action: 'submit' },
      { resource: 'forms', action: 'view_responses' },
      
      // Groups permissions
      { resource: 'groups', action: 'create' },
      { resource: 'groups', action: 'read' },
      { resource: 'groups', action: 'update' },
      { resource: 'groups', action: 'delete' },
      
      // Permissions permissions
      { resource: 'permissions', action: 'create' },
      { resource: 'permissions', action: 'read' },
      { resource: 'permissions', action: 'update' },
      { resource: 'permissions', action: 'delete' },
    ];

    for (const permData of defaultPermissions) {
      const exists = await this.findByResourceAndAction(permData.resource, permData.action);
      if (!exists) {
        await this.create(permData);
      }
    }
  }
}
