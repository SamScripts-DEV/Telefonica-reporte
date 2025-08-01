import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { Form } from '../../entities/form.entity';
import { Question } from '../../entities/question.entity';
import { FormResponse } from '../../entities/form-response.entity';
import { QuestionResponse } from '../../entities/question-response.entity';
import { Tower } from '../../entities/tower.entity';
import { Technician } from '../../entities/technician.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Form, 
    Question, 
    FormResponse, 
    QuestionResponse, 
    Tower, 
    Technician
  ])],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}
