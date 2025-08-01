import { IsString } from 'class-validator';

export class CreateTowerDto {
  @IsString()
  name: string;
}
