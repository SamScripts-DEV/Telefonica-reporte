import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];
}
