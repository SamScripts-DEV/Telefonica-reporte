import { IsEmail, IsString, IsOptional, IsBoolean, IsNumber, MinLength, IsArray } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsNumber()
  roleId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  towerIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  groupIds?: number[];
}
