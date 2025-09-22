import {
    Controller,
    Get,
    Query,
    UseGuards,
    Param,
    BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';


@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    // 📋 LISTA PRINCIPAL DE FORMULARIOS
    @Get('forms')
    @Roles('dev', 'superadmin', 'pm', 'jefe')
    getFormsList(@GetUser() user: RequestUser) {
        return this.reportsService.getFormsList(user);
    }

    // 📊 DASHBOARD PRINCIPAL DEL FORMULARIO
    @Get('forms/:formId/dashboard')
    @Roles('dev', 'superadmin', 'pm', 'jefe')
    getFormDashboard(
        @Param('formId') formId: string,
        @Query('months') months: number = 6,
        @GetUser() user: RequestUser
    ) {
        return this.reportsService.getFormDashboard(formId, months, user);
    }

    // 🏗️ ANÁLISIS DETALLADO POR TORRE
    @Get('forms/:formId/towers/:towerId')
    @Roles('dev', 'superadmin', 'pm', 'jefe')
    getTowerAnalysis(
        @Param('formId') formId: string,
        @Param('towerId') towerId: string,
        @Query('months') months: string = '6',
        @GetUser() user: RequestUser
    ) {
        const monthsNum = parseInt(months) || 6;
        const towerIdNum = parseInt(towerId);

        if (isNaN(towerIdNum)) {
            throw new BadRequestException('Tower ID debe ser un número válido');
        }

        return this.reportsService.getTowerAnalysis(formId, towerIdNum, monthsNum, user);
    }


    // ANÁLISIS DETALLADO POR TÉCNICO
    @Get('forms/:formId/technicians/:technicianId')
    @Roles('dev', 'superadmin', 'pm', 'jefe')
    getTechnicianAnalysis(
        @Param('formId') formId: string,
        @Param('technicianId') technicianId: string,
        @Query('months') months: string = '6',
        @GetUser() user: RequestUser
    ) {
        const monthsNum = parseInt(months) || 6;
        return this.reportsService.getTechnicianAnalysis(formId, technicianId, monthsNum, user);
    }

    // 👥 ANÁLISIS POR EVALUADOR
    @Get('forms/:formId/evaluators/:evaluatorId')
    @Roles('dev', 'superadmin', 'pm', 'jefe')
    getEvaluatorAnalysis(
        @Param('formId') formId: string,
        @Param('evaluatorId') evaluatorId: string,
        @Query('months') months: string = '6',
        @GetUser() user: RequestUser
    ) {
        const monthsNum = parseInt(months) || 6;
        return this.reportsService.getEvaluatorAnalysis(formId, evaluatorId, monthsNum, user);
    }

    // 📈 COMPARATIVA ENTRE TORRES
    @Get('forms/:formId/towers-comparison')
    @Roles('dev', 'superadmin', 'pm', 'jefe')
    getTowersComparison(
        @Param('formId') formId: string,
        @Query('period') period: string,
        @GetUser() user: RequestUser
    ) {
        return this.reportsService.getTowersComparison(formId, period, user);
    }
}
