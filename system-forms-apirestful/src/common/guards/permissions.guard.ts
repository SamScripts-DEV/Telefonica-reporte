import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupsService } from '../../modules/groups/groups.service';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (resource: string, action: string) => 
  Reflect.defineMetadata(PERMISSIONS_KEY, { resource, action }, {});

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private groupsService: GroupsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<{resource: string, action: string}>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    
    if (!permission) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // Super admins and devs have all permissions
    if (['dev', 'superadmin'].includes(user.roleName)) {
      return true;
    }
    
    // Check group-based permissions
    return await this.groupsService.hasPermission(
      user.id, 
      permission.resource, 
      permission.action
    );
  }
}
