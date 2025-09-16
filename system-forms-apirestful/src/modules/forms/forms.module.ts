import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { FormsSchedulerService } from './forms-schedule.service';
import { Form } from '../../entities/form.entity';
import { Question } from '../../entities/question.entity';
import { FormResponse } from '../../entities/form-response.entity';
import { QuestionResponse } from '../../entities/question-response.entity';
import { Tower } from '../../entities/tower.entity';
import { Technician } from '../../entities/technician.entity';
import { User } from 'src/entities';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([
    Form, 
    Question, 
    FormResponse, 
    QuestionResponse, 
    Tower, 
    Technician,
    User
  ])],
  controllers: [FormsController],
  providers: [FormsService, FormsSchedulerService],
  exports: [FormsService],
})
export class FormsModule {}
