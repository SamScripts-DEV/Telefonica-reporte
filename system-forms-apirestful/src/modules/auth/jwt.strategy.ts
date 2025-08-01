import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { JwtPayload } from '../../common/interfaces/auth.interface';

function jwtExtractor(req: any): string | null {
  // Primero intenta por cookie
  if (req?.cookies?.access_token) {
    return req.cookies.access_token;
  }
  // Luego intenta por header Authorization: Bearer <token>
  if (req?.headers?.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: jwtExtractor,
      secretOrKey: configService.get('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
      relations: ['role', 'towers', 'groups', 'groups.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name,
      towerIds: user.towers?.map(tower => tower.id) || [],
      groupIds: user.groups?.map(group => group.id) || [],
      permissions: user.groups?.flatMap(group => group.permissions) || [],
    };
  }
}
