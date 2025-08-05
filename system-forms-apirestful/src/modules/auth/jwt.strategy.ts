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
      relations: ['role', 'towers'], // <-- Asegúrate que incluya 'towers'
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.name,
      roleId: user.roleId,
      roleName: user.role?.name,
      towerIds: user.towers?.map(tower => tower.id) || [],
      towers: user.towers?.map(tower => ({ 
        id: tower.id, 
        name: tower.name 
      })) || [], // <-- Agrega esta línea
    };
  }
}
