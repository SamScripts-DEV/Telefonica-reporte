import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('permissions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('dev', 'superadmin')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @Roles('dev', 'superadmin')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @Roles('dev', 'superadmin')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(+id);
  }

  @Patch(':id')
  @Roles('dev', 'superadmin')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  @Roles('dev', 'superadmin')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(+id);
  }

  @Post('seed')
  @Roles('dev', 'superadmin')
  seedDefaultPermissions() {
    return this.permissionsService.seedDefaultPermissions();
  }
}
