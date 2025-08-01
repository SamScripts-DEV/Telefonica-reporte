import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles('dev', 'superadmin')
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(createGroupDto);
  }

  @Get()
  @Roles('dev', 'superadmin')
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @Roles('dev', 'superadmin')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(+id);
  }

  @Patch(':id')
  @Roles('dev', 'superadmin')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupsService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  @Roles('dev', 'superadmin')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(+id);
  }

  @Patch(':id/permissions')
  @Roles('dev', 'superadmin')
  assignPermissions(@Param('id') id: string, @Body('permissionIds') permissionIds: number[]) {
    return this.groupsService.assignPermissionsToGroup(+id, permissionIds);
  }

  @Get('user/:userId/permissions')
  @Roles('dev', 'superadmin')
  getUserPermissions(@Param('userId') userId: string) {
    return this.groupsService.getUserPermissions(userId);
  }

  @Post('seed')
  @Roles('dev', 'superadmin')
  seedDefaultGroups() {
    return this.groupsService.seedDefaultGroups();
  }
}
