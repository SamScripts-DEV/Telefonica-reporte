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
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { UpdateTechnicianDto } from './dto/update-technician.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';

@Controller('technicians')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) { }


  @Get()
  //@Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador')
  findAll(@Query() paginationDto: PaginationDto, @GetUser() user: RequestUser) {
    return this.techniciansService.findAll(paginationDto, user);
  }

  @Get('tower/:towerId')
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador')
  findByTower(@Param('towerId') towerId: string) {
    return this.techniciansService.findByTower(+towerId);
  }

  @Get(':id')
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador')
  findOne(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.techniciansService.findOne(id, user);
  }

  @Post()
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  create(@Body() createTechnicianDto: CreateTechnicianDto) {
    console.log('[CONTROLLER] Create Technician DTO:', createTechnicianDto);
    
    return this.techniciansService.create(createTechnicianDto);
  }

  @Patch(':id')
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  update(@Param('id') id: string, @Body() updateTechnicianDto: UpdateTechnicianDto, @GetUser() user: RequestUser) {
    return this.techniciansService.update(id, updateTechnicianDto, user);
  }

  @Delete(':id')
  @Roles('dev', 'superadmin', 'pm')
  remove(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.techniciansService.remove(id, user);
  }

  @Patch(':id/assign-evaluator')
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  assignEvaluator(@Param('id') id: string, @Body('evaluatorId') evaluatorId: string) {
    return this.techniciansService.assignEvaluator(id, evaluatorId);
  }
}
