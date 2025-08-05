import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TowersService } from './towers.service';
import { CreateTowerDto } from './dto/create-tower.dto';
import { UpdateTowerDto } from './dto/update-tower.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';

@Controller('towers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TowersController {
  constructor(private readonly towersService: TowersService) {}

  @Post()
  @Roles('dev', 'superadmin')
  create(@Body() createTowerDto: CreateTowerDto) {
    return this.towersService.create(createTowerDto);
  }

  @Get()
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  findAll(@Query() paginationDto: PaginationDto, @GetUser() user: RequestUser) {
    return this.towersService.findAll(paginationDto, user);
  }

  @Get(':id')
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador')
  findOne(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.towersService.findOne(+id, user);
  }

  @Patch(':id')
  @Roles('dev', 'superadmin')
  update(@Param('id') id: string, @Body() updateTowerDto: UpdateTowerDto) {
    return this.towersService.update(+id, updateTowerDto);
  }

  @Delete(':id')
  @Roles('dev', 'superadmin')
  remove(@Param('id') id: string) {
    return this.towersService.remove(+id);
  }
}
