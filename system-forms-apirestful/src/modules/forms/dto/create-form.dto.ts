import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { FormStatus } from '../../../entities/form.entity';
import { QuestionType } from '../../../entities/question.entity';

export class CreateQuestionDto {
  @IsString()
  questionText: string;

  @IsEnum(QuestionType)
  questionType: QuestionType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  options?: any;

  @IsOptional()
  @IsNumber()
  position?: number;
}

export class CreateFormDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  towerIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
