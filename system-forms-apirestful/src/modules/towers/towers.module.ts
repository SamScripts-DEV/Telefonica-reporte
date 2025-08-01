import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TowersService } from './towers.service';
import { TowersController } from './towers.controller';
import { Tower } from '../../entities/tower.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tower])],
  controllers: [TowersController],
  providers: [TowersService],
  exports: [TowersService],
})
export class TowersModule {}
