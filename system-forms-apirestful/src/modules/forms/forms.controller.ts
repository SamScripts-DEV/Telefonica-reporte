import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { FormStatus } from '../../entities/form.entity';
import { BulkSubmitDto } from './dto/bulk-evaluation.dto';

@Controller('forms')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FormsController {
  constructor(private readonly formsService: FormsService) { }

  //Consumido
  @Post('create')
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  create(@Body() createFormDto: CreateFormDto, @GetUser() user: RequestUser) {
    return this.formsService.create(createFormDto, user);
  }

  // @Get('pending')
  // @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  // getPendingForms(@Query() paginationDto: PaginationDto, @GetUser() user: RequestUser) {
  //   return this.formsService.getPendingFormsForUser(paginationDto, user);
  // }


  //Consumido
  @Get()
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  findAll( @GetUser() user: RequestUser) {
    return this.formsService.findAll(user);
  }

  //Consumiendo
  @Get(':id')
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  findOne(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.formsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  update(@Param('id') id: string, @Body() updateFormDto: UpdateFormDto, @GetUser() user: RequestUser) {
    return this.formsService.update(id, updateFormDto, user);
  }

  @Delete(':id')
  @Roles('dev', 'superadmin', 'pm')
  remove(@Param('id') id: string, @GetUser() user: RequestUser) {
    return this.formsService.remove(id, user);
  }

  @Post(':id/submit')
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  submitForm(@Param('id') id: string, @Body() submitFormDto: SubmitFormDto, @GetUser() user: RequestUser) {
    return this.formsService.submitForm(id, submitFormDto, user);
  }

  @Get(':id/responses')
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  getFormResponses(@Param('id') id: string, @Query() paginationDto: PaginationDto, @GetUser() user: RequestUser) {
    return this.formsService.getFormResponses(id, user, paginationDto);
  }

  @Patch(':id/status')
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  changeStatus(@Param('id') id: string, @Body('status') status: FormStatus, @GetUser() user: RequestUser) {
    return this.formsService.changeFormStatus(id, status, user);
  }

  @Patch(':id/towers')
  @Roles('dev', 'superadmin', 'pm', 'jefe')
  assignTowers(@Param('id') id: string, @Body('towerIds') towerIds: number[], @GetUser() user: RequestUser) {
    return this.formsService.assignTowersToForm(id, towerIds);
  }

  @Get('evaluation-matrix/:towerId')
  //@Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  getEvaluationMatrix(
    @Param('towerId', ParseIntPipe) towerId: number,
    @GetUser() user: RequestUser
  ) {
    return this.formsService.getEvaluationMatrix(towerId, user);
  }

  @Get('evaluation-progress/:towerId')
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  getEvaluationProgress(
    @Param('towerId', ParseIntPipe) towerId: number,
    @GetUser() user: RequestUser
  ) {
    return this.formsService.getEvaluationProgress(towerId, user);
  }

  @Post('bulk-submit')
  @Roles('dev', 'superadmin', 'pm', 'jefe', 'evaluador', 'client')
  bulkSubmitEvaluations(
    @Body() bulkSubmitDto: BulkSubmitDto,
    @GetUser() user: RequestUser
  ) {
    return this.formsService.bulkSubmitEvaluations(bulkSubmitDto, user);
  }


  @Post('check-periodic')
  @Roles('dev', 'superadmin')
  async checkPeriodicForms(@GetUser() user: RequestUser) {
    console.log('🔄 Manual check triggered by:', user.email);
    await this.formsService.checkAndUpdatePeriodicForms();
    return {
      message: 'Periodic forms check completed',
      timestamp: new Date().toISOString(),
      triggeredBy: user.email
    };
  }



}
