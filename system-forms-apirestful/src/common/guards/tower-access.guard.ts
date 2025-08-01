import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RequestUser } from '../interfaces/auth.interface';

@Injectable()
export class TowerAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;
    const towerId = parseInt(request.params.towerId || request.body.towerId || request.query.towerId);

    // Super admin can access all towers
    if (user.roleName === 'superadmin' || user.roleName === 'dev') {
      return true;
    }

    // Check if user has access to the specific tower
    if (towerId && !user.towerIds.includes(towerId)) {
      throw new ForbiddenException('Access denied to this tower');
    }

    return true;
  }
}
