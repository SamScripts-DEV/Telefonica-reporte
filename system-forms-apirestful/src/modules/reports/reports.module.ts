import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { 
  Form, 
  FormResponse, 
  Question,
  QuestionResponse,
  Technician,
  Tower,
  User 
} from 'src/entities';


@Module({
  imports:[
    TypeOrmModule.forFeature([
      Form,
      FormResponse,
      Question,
      QuestionResponse,
      Technician,
      Tower,
      User
    ])
  ],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
