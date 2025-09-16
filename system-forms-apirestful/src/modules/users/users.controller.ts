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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles('dev', 'superadmin', 'pm')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('dev', 'superadmin', 'pm')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('dev', 'superadmin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/towers')
  @Roles('dev', 'superadmin', 'pm')
  assignTowers(@Param('id') id: string, @Body('towerIds') towerIds: number[]) {
    return this.usersService.assignTowersToUser(id, towerIds);
  }

  @Patch(':id/groups')
  @Roles('dev', 'superadmin')
  assignGroups(@Param('id') id: string, @Body('groupIds') groupIds: number[]) {
    return this.usersService.assignGroupsToUser(id, groupIds);
  }


  @Get(':id/evaluation-status')
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  getUserEvaluationStatus(@Param('id') id: string) {
    return this.usersService.getUserEvaluationStatus(id);
  }

  // En UsersController
  @Post('sync-technician-mappings')
  //@Roles('dev', 'superadmin', 'pm')
  syncTechnicianMappings() {
    return this.usersService.syncAllEvaluatorTechnicianMappings();
  }
}
