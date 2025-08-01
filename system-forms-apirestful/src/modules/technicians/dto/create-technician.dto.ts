import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateTechnicianDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  towerId?: number;
}
