import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechniciansService } from './technicians.service';
import { TechniciansController } from './technicians.controller';
import { Technician } from '../../entities/technician.entity';
import { Tower } from '../../entities/tower.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Technician, Tower])],
  controllers: [TechniciansController],
  providers: [TechniciansService],
  exports: [TechniciansService],
})
export class TechniciansModule {}
