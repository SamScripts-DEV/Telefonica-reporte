import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { FormStatus, FormType } from '../../../entities/form.entity';
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
  @IsEnum(FormType)
  type?: FormType;

  @IsOptional()
  @IsEnum(FormStatus)
  status?: FormStatus;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  // ⭐ CAMPOS PARA FORMULARIOS PERIÓDICOS
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  startDay?: number; // Día que se abre (ej: 27)

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  endDay?: number; // Día que se cierra (ej: 5)

  @IsOptional()
  @IsBoolean()
  autoActivate?: boolean; // Se activa automáticamente

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
