import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  questionId: string;
  value: string;
}

export class SubmitFormDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
