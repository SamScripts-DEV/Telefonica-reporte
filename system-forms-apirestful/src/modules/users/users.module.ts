import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../entities/user.entity';
import { Tower } from '../../entities/tower.entity';
import { Role } from '../../entities/role.entity';
import { Group } from '../../entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tower, Role, Group])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
