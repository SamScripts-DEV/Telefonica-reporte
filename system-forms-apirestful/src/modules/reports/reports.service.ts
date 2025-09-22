import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from '../../entities/form.entity';
import { FormResponse } from '../../entities/form-response.entity';
import { Question, QuestionType } from '../../entities/question.entity';
import { QuestionResponse } from '../../entities/question-response.entity';
import { Technician } from '../../entities/technician.entity';
import { Tower } from '../../entities/tower.entity';
import { User } from '../../entities/user.entity';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { AlertDto, EvaluatorAnalysisResponseDto, EvaluatorSummaryDto, FormDashboardResponseDto, FormsListResponseDto, OverallTrendDto, QuestionTrendDto, TechnicianAnalysisResponseDto, TopPerformer, TowerAnalysisResponseDto, TowersComparisonResponseDto, TowerSummaryDto } from './reports.dto';




@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Form)
        private formRepository: Repository<Form>,
        @InjectRepository(FormResponse)
        private formResponseRepository: Repository<FormResponse>,
        @InjectRepository(Question)
        private questionRepository: Repository<Question>,
        @InjectRepository(QuestionResponse)
        private questionResponseRepository: Repository<QuestionResponse>,
        @InjectRepository(Technician)
        private technicianRepository: Repository<Technician>,
        @InjectRepository(Tower)
        private towerRepository: Repository<Tower>,
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) { }


    private readonly EVALUATOR_STATUS = {
        COMPLIANT: 'compliant' as const,
        PENDING: 'pending' as const
    };

    //------------------------------------------------------------------------------------------------------------------------------------------

    // LISTA DE FORMULARIOS CON MÉTRICAS BÁSICAS
    async getFormsList(user: RequestUser): Promise<FormsListResponseDto> {
        // Primero obtenemos todos los formularios activos
        const forms = await this.formRepository
            .createQueryBuilder('form')
            //.where('form.status = :status', { status: 'active' })
            .getMany();

        const formsSummary = await Promise.all(
            forms.map(async (form) => {
                // Calcular métricas básicas
                const totalResponses = await this.formResponseRepository.count({
                    where: { formId: form.id }
                });

                // Última actividad
                const lastActivity = await this.formResponseRepository
                    .createQueryBuilder('fr')
                    .where('fr.form_id = :formId', { formId: form.id })
                    .orderBy('fr.submittedAt', 'DESC')
                    .getOne();

                // Para formularios periódicos, contar períodos únicos
                let periodsCount = 0;
                if (form.type === 'periodic') {
                    const periods = await this.formResponseRepository
                        .createQueryBuilder('fr')
                        .select('DISTINCT fr.evaluation_period', 'period')
                        .where('fr.form_id = :formId', { formId: form.id })
                        .andWhere('fr.evaluation_period IS NOT NULL')
                        .getRawMany();

                    periodsCount = periods.length;
                }

                // Calcular promedio de satisfacción si hay preguntas de escala
                const avgSatisfaction = await this.calculateFormAverageRating(form.id);

                // Contar técnicos únicos que han sido evaluados
                const uniqueEvaluatedTechnicians = await this.formResponseRepository
                    .createQueryBuilder('fr')
                    .leftJoin('question_responses', 'qr', 'qr.form_response_id = fr.id')
                    .select('COUNT(DISTINCT qr.technician_id)', 'count')
                    .where('fr.form_id = :formId', { formId: form.id })
                    .andWhere('qr.technician_id IS NOT NULL')
                    .getRawOne();

                return {
                    formId: form.id,
                    title: form.title,
                    description: form.description,
                    type: form.type,
                    status: form.status,
                    version: form.version,
                    createdBy: form.createdBy,
                    totalResponses,
                    lastActivity: lastActivity?.submittedAt || null,
                    periodsCount,
                    avgSatisfaction: avgSatisfaction ? Math.round(avgSatisfaction * 100) / 100 : null, // Redondear a 2 decimales
                    uniqueEvaluatedTechnicians: parseInt(uniqueEvaluatedTechnicians?.count || '0'),
                    // Métricas adicionales útiles
                    hasScaleQuestions: avgSatisfaction !== null,
                    isActive: form.status === 'active',
                    daysWithoutActivity: lastActivity
                        ? Math.floor((new Date().getTime() - lastActivity.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
                        : null
                };
            })
        );

        // Ordenar por última actividad (más recientes primero)
        formsSummary.sort((a, b) => {
            if (!a.lastActivity && !b.lastActivity) return 0;
            if (!a.lastActivity) return 1;
            if (!b.lastActivity) return -1;
            return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        });

        return {
            data: formsSummary,
            total: formsSummary.length,
            summary: {
                totalForms: formsSummary.length,
                formsWithActivity: formsSummary.filter(f => f.totalResponses > 0).length,
                periodicForms: formsSummary.filter(f => f.type === 'periodic').length,
                singleForms: formsSummary.filter(f => f.type === 'single').length,
                avgSatisfactionAcrossAllForms: formsSummary
                    .filter(f => f.avgSatisfaction !== null)
                    .reduce((acc, f, _, arr) => acc + (f.avgSatisfaction as number) / arr.length, 0)
            }
        };
    }

    // DASHBOARD PRINCIPAL DEL FORMULARIO
    async getFormDashboard(formId: string, months: number, user: RequestUser): Promise<FormDashboardResponseDto> {
        const form = await this.formRepository.findOne({
            where: { id: formId }
        });

        if (!form) {
            throw new NotFoundException('Formulario no encontrado');
        }

        // Obtener períodos disponibles (últimos X meses)
        const periods = await this.getAvailablePeriods(formId, months);

        // Obtener tendencias por pregunta de escala
        const questionTrends = await this.getQuestionTrends(formId, periods);

        // Obtener resumen por torre
        const towerSummary = await this.getTowersSummary(formId, periods[0]); // período más reciente

        // Obtener evaluadores con métricas
        const evaluatorsSummary = await this.getEvaluatorsSummary(formId, periods[0]);

        return {
            formInfo: {
                id: form.id,
                title: form.title,
                type: form.type,
                status: form.status
            },
            timeRange: {
                months,
                periods,
                currentPeriod: periods[0] || null
            },
            trends: {
                questionTrends,
                overallTrend: await this.getOverallTrend(formId, periods)
            },
            towers: towerSummary,
            evaluators: evaluatorsSummary,
            alerts: await this.generateAlerts(formId, periods[0])
        };
    }

    // 🔧 MÉTODOS AUXILIARES

    private async calculateFormAverageRating(formId: string): Promise<number | null> {
        // Primero verificamos si existen preguntas de escala para este formulario
        const scaleQuestions = await this.questionRepository.find({
            where: {
                formId,
                questionType: QuestionType.RATING
            }
        });

        if (scaleQuestions.length === 0) return null;

        const questionIds = scaleQuestions.map(q => q.id);

        const result = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
            .where('qr.question_id IN (:...questionIds)', { questionIds })
            .andWhere('qr.value IS NOT NULL')
            .andWhere('qr.value != \'\'')
            .andWhere('qr.value ~ \'^[1-5]$\'') // Solo números del 1 al 5
            .andWhere('CAST(qr.value AS DECIMAL) BETWEEN 1 AND 5') // Asegurar que sea un rating válido
            .getRawOne();

        return result?.avgRating ? parseFloat(result.avgRating) : null;
    }

    private async getAvailablePeriods(formId: string, months: number): Promise<string[]> {
        const periods = await this.formResponseRepository
            .createQueryBuilder('fr')
            .select('DISTINCT fr.evaluation_period', 'period')
            .where('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period IS NOT NULL')
            .orderBy('fr.evaluation_period', 'DESC')
            .limit(months)
            .getRawMany();

        return periods.map(p => p.period);
    }

    private async getQuestionTrends(formId: string, periods: string[]): Promise<QuestionTrendDto[]> {
        if (periods.length === 0) return [];

        // Obtener todas las preguntas de rating del formulario
        const ratingQuestions = await this.questionRepository.find({
            where: {
                formId,
                questionType: QuestionType.RATING
            },
            order: { position: 'ASC' }
        });

        if (ratingQuestions.length === 0) return [];

        const questionTrends = await Promise.all(
            ratingQuestions.map(async (question) => {
                // Para cada pregunta, obtener datos por período
                const periodData = await Promise.all(
                    periods.map(async (period) => {
                        const result = await this.questionResponseRepository
                            .createQueryBuilder('qr')
                            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                            .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
                            .addSelect('COUNT(qr.value)', 'responseCount')
                            .where('qr.question_id = :questionId', { questionId: question.id })
                            .andWhere('fr.evaluation_period = :period', { period })
                            .andWhere('qr.value IS NOT NULL')
                            .andWhere('qr.value != \'\'')
                            .andWhere('qr.value ~ \'^[1-5]$\'')
                            .andWhere('CAST(qr.value AS DECIMAL) BETWEEN 1 AND 5')
                            .getRawOne();

                        return {
                            period,
                            avgRating: result?.avgRating ? parseFloat(result.avgRating) : 0,
                            responseCount: parseInt(result?.responseCount || '0')
                        };
                    })
                );

                // Calcular tendencia (comparar último período con el anterior)
                let trend: 'improving' | 'declining' | 'stable' = 'stable';
                let changePercentage = 0;

                if (periodData.length >= 2) {
                    const latest = periodData[0];
                    const previous = periodData[1];

                    if (latest.avgRating > 0 && previous.avgRating > 0) {
                        const change = ((latest.avgRating - previous.avgRating) / previous.avgRating) * 100;
                        changePercentage = Math.round(change * 100) / 100;

                        if (change > 2) trend = 'improving';
                        else if (change < -2) trend = 'declining';
                        else trend = 'stable';
                    }
                }

                return {
                    questionId: question.id,
                    questionText: question.questionText,
                    position: question.position,
                    data: periodData,
                    trend,
                    changePercentage,
                    currentAvg: periodData[0]?.avgRating || 0,
                    totalResponses: periodData.reduce((sum, p) => sum + p.responseCount, 0)
                };
            })
        );

        return questionTrends.sort((a, b) => a.position - b.position);
    }

    private async getTowersSummary(formId: string, currentPeriod: string): Promise<TowerSummaryDto[]> {
        if (!currentPeriod) return [];

        // Obtener todas las torres que tienen técnicos evaluados en este formulario
        const towersWithData = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('technicians', 't', 't.id = qr.technician_id')
            .leftJoin('towers', 'tower', 'tower.id = t.tower_id')
            .select('tower.id', 'towerId')
            .addSelect('tower.name', 'towerName')
            .where('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('qr.technician_id IS NOT NULL')
            .andWhere('tower.id IS NOT NULL')
            .groupBy('tower.id, tower.name')
            .getRawMany();

        const towerSummary = await Promise.all(
            towersWithData.map(async (tower) => {
                // Obtener métricas para esta torre en el período actual
                const metrics = await this.getTowerMetricsForPeriod(formId, tower.towerId, currentPeriod);

                // Contar técnicos totales en la torre
                const totalTechnicians = await this.technicianRepository.count({
                    where: { towerId: tower.tower_id }
                });

                return {
                    towerId: tower.towerId,
                    towerName: tower.towerName,
                    avgRating: metrics.avgRating,
                    responseCount: metrics.responseCount,
                    evaluatedTechnicians: metrics.uniqueTechnicians,
                    totalTechnicians,
                    coveragePercentage: totalTechnicians > 0
                        ? Math.round((metrics.uniqueTechnicians / totalTechnicians) * 100)
                        : 0,
                    isAboveAverage: metrics.avgRating > 0 // Se calculará después
                };
            })
        );

        // Calcular promedio general para determinar qué torres están por encima
        const overallAvg = towerSummary.length > 0
            ? towerSummary.reduce((sum, t) => sum + t.avgRating, 0) / towerSummary.length
            : 0;

        // Actualizar flag isAboveAverage
        towerSummary.forEach(tower => {
            tower.isAboveAverage = tower.avgRating > overallAvg;
        });

        // Ordenar por rating promedio (mejores primero)
        return towerSummary.sort((a, b) => b.avgRating - a.avgRating);
    }

    private async getTowerMetricsForPeriod(formId: string, towerId: number, period: string) {
        const result = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('technicians', 't', 't.id = qr.technician_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
            .addSelect('COUNT(qr.value)', 'responseCount')
            .addSelect('COUNT(DISTINCT qr.technician_id)', 'uniqueTechnicians')
            .where('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period })
            .andWhere('t.tower_id = :towerId', { towerId })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value IS NOT NULL')
            .andWhere('qr.value != \'\'')
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .andWhere('CAST(qr.value AS DECIMAL) BETWEEN 1 AND 5')
            .getRawOne();

        return {
            avgRating: result?.avgRating ? Math.round(parseFloat(result.avgRating) * 100) / 100 : 0,
            responseCount: parseInt(result?.responseCount || '0'),
            uniqueTechnicians: parseInt(result?.uniqueTechnicians || '0')
        };
    }


    private async getEvaluatorsSummary(formId: string, currentPeriod: string): Promise<EvaluatorSummaryDto[]> {
        if (!currentPeriod) return [];

        // Obtener evaluadores que han hecho evaluaciones en este período
        const evaluators = await this.formResponseRepository
            .createQueryBuilder('fr')
            .leftJoin('users', 'u', 'u.id = fr.user_id')
            .select('u.id', 'evaluatorId')
            .addSelect('u.name', 'evaluatorName')
            .addSelect('COUNT(DISTINCT fr.id)', 'evaluationsCount')
            .addSelect('MAX(fr.submitted_at)', 'lastEvaluation')
            .where('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('u.id IS NOT NULL')
            .groupBy('u.id, u.name')
            .getRawMany();

        const evaluatorsSummary = await Promise.all(
            evaluators.map(async (evaluator) => {

                const evaluatedTechnicians = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .select('COUNT(DISTINCT qr.technician_id)', 'count')
                    .where('fr.user_id = :evaluatorId', { evaluatorId: evaluator.evaluatorId })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
                    .andWhere('qr.technician_id IS NOT NULL')
                    .getRawOne();

                // Obtener técnicos asignados a este evaluador
                const assignedTechnicians = await this.userRepository
                    .createQueryBuilder('u')
                    .leftJoin('evaluator_technician_map', 'etm', 'etm.evaluator_id = u.id')
                    .select('COUNT(etm.technician_id)', 'count')
                    .where('u.id = :evaluatorId', { evaluatorId: evaluator.evaluatorId })
                    .getRawOne();

                const assigned = parseInt(assignedTechnicians?.count || '0');
                const evaluated = parseInt(evaluatedTechnicians?.count || '0');
                const formsCompleted = parseInt(evaluator.evaluationsCount);

                const isCompliant = assigned > 0 && (evaluated / assigned) >= 0.8;
                const status = isCompliant ? this.EVALUATOR_STATUS.COMPLIANT : this.EVALUATOR_STATUS.PENDING;

                return {
                    evaluatorId: evaluator.evaluatorId,
                    evaluatorName: evaluator.evaluatorName,
                    evaluationsCompleted: formsCompleted,
                    assignedTechnicians: assigned,
                    evaluatedTechnicians: evaluated,
                    coveragePercentage: assigned > 0 ? Math.round((evaluated / assigned) * 100) : 0,
                    lastEvaluation: evaluator.lastEvaluation,
                    status
                };
            })
        );

        return evaluatorsSummary.sort((a, b) => b.coveragePercentage - a.coveragePercentage);
    }

    private async getOverallTrend(formId: string, periods: string[]): Promise<OverallTrendDto[]> {
        if (periods.length === 0) return [];

        const overallTrend = await Promise.all(
            periods.map(async (period) => {
                // Obtener todas las preguntas de rating
                const ratingQuestions = await this.questionRepository.find({
                    where: { formId, questionType: QuestionType.RATING }
                });

                if (ratingQuestions.length === 0) {
                    return {
                        period,
                        avgRating: 0,
                        totalResponses: 0
                    };
                }

                const questionIds = ratingQuestions.map(q => q.id);

                const result = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
                    .addSelect('COUNT(qr.value)', 'responseCount')
                    .where('qr.question_id IN (:...questionIds)', { questionIds })
                    .andWhere('fr.evaluation_period = :period', { period })
                    .andWhere('qr.value IS NOT NULL')
                    .andWhere('qr.value != \'\'')
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .andWhere('CAST(qr.value AS DECIMAL) BETWEEN 1 AND 5')
                    .getRawOne();

                return {
                    period,
                    avgRating: result?.avgRating ? Math.round(parseFloat(result.avgRating) * 100) / 100 : 0,
                    totalResponses: parseInt(result?.responseCount || '0')
                };
            })
        );

        return overallTrend;
    }

    private async generateAlerts(formId: string, currentPeriod: string): Promise<AlertDto[]> {
        if (!currentPeriod) return [];

        const alerts: AlertDto[] = [];

        // Alert 1: Torres con baja satisfacción (< 3.5)
        const lowSatisfactionTowers = await this.getTowersSummary(formId, currentPeriod);
        const poorTowers = lowSatisfactionTowers.filter(t => t.avgRating < 3.5 && t.responseCount > 0);

        if (poorTowers.length > 0) {
            alerts.push({
                type: 'warning',
                category: 'satisfaction',
                title: 'Torres con Baja Satisfacción',
                message: `${poorTowers.length} torre(s) tienen calificación promedio menor a 3.5`,
                data: poorTowers.map(t => ({ towerName: t.towerName, rating: t.avgRating }))
            });
        }

        // Alert 2: Evaluadores con baja cobertura (< 70%)
        const evaluators = await this.getEvaluatorsSummary(formId, currentPeriod);
        const lowCoverageEvaluators = evaluators.filter(e => e.coveragePercentage < 70);

        if (lowCoverageEvaluators.length > 0) {
            alerts.push({
                type: 'warning',
                category: 'coverage',
                title: 'Evaluadores con Baja Cobertura',
                message: `${lowCoverageEvaluators.length} evaluador(es) tienen menos del 70% de cobertura`,
                data: lowCoverageEvaluators.map(e => ({
                    evaluatorName: e.evaluatorName,
                    coverage: e.coveragePercentage
                }))
            });
        }

        // Alert 3: Formulario sin actividad reciente (más de 7 días)
        const lastActivity = await this.formResponseRepository
            .createQueryBuilder('fr')
            .where('fr.form_id = :formId', { formId })
            .orderBy('fr.submitted_at', 'DESC')
            .getOne();

        if (lastActivity) {
            const daysSinceActivity = Math.floor(
                (new Date().getTime() - lastActivity.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceActivity > 7) {
                alerts.push({
                    type: 'info',
                    category: 'activity',
                    title: 'Formulario Inactivo',
                    message: `${daysSinceActivity} días sin nueva evaluación`,
                    data: { lastActivity: lastActivity.submittedAt }
                });
            }
        }

        return alerts;
    }

    //------------------------------------------------------------------------------------------------------------------------------------------

    async getTowerAnalysis(formId: string, towerId: number, months: number = 6, user: RequestUser): Promise<TowerAnalysisResponseDto> {
        // Verificar que el formulario existe
        const form = await this.formRepository.findOne({
            where: { id: formId }
        });

        if (!form) {
            throw new NotFoundException('Formulario no encontrado');
        }

        // Verificar que la torre existe
        const tower = await this.towerRepository.findOne({
            where: { id: towerId }
        });

        if (!tower) {
            throw new NotFoundException('Torre no encontrada');
        }

        // Obtener períodos disponibles
        const periods = await this.getAvailablePeriods(formId, months);
        const currentPeriod = periods[0];

        // Obtener información básica de la torre
        const towerInfo = await this.getTowerBasicInfo(towerId, formId, currentPeriod);

        // Obtener performance y ranking
        const performance = await this.getTowerPerformanceSimple(formId, towerId, currentPeriod);

        // Obtener tendencias temporales
        const trends = await this.getTowerTrends(formId, towerId, periods);

        // Obtener análisis de técnicos
        const technicians = await this.getTowerTechniciansAnalysis(formId, towerId, currentPeriod);

        // Obtener desglose por preguntas
        const questionBreakdown = await this.getTowerQuestionBreakdown(formId, towerId, currentPeriod);



        // Generar insights automáticos
        const insights = await this.generateTowerInsightsSimple(formId, towerId, currentPeriod, {
            towerInfo,
            performance,
            trends,
            technicians,
            questionBreakdown,

        });

        return {
            towerInfo,
            performance,
            trends,
            technicians,
            questionBreakdown,
            insights
        };
    }


    // MÉTODOS AUXILIARES PARA TOWER ANALYSIS

    private async getTowerPerformanceSimple(formId: string, towerId: number, currentPeriod: string) {
        if (!currentPeriod) {
            return {
                avgRating: 0,
                totalResponses: 0,
                responsesByPeriod: 0,
                performanceLevel: 'needs_improvement' as const
            };
        }

        // Solo métricas de la torre específica
        const metrics = await this.getTowerMetricsForPeriod(formId, towerId, currentPeriod);

        // Determinar nivel de performance
        let performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
        if (metrics.avgRating >= 4.5) performanceLevel = 'excellent';
        else if (metrics.avgRating >= 4.0) performanceLevel = 'good';
        else if (metrics.avgRating >= 3.0) performanceLevel = 'average';
        else performanceLevel = 'needs_improvement';

        return {
            avgRating: metrics.avgRating,
            totalResponses: metrics.responseCount,
            responsesByPeriod: metrics.responseCount,
            performanceLevel
        };
    }

    private async generateTowerInsightsSimple(formId: string, towerId: number, currentPeriod: string, data: any) {
        const insights: Array<{
            type: 'strength' | 'opportunity' | 'alert';
            category: string;
            message: string;
            data?: any;
        }> = [];

        // Insight 1: Performance general de la torre
        if (data.performance.performanceLevel === 'excellent') {
            insights.push({
                type: 'strength',
                category: 'performance',
                message: `Torre con excelente desempeño (${data.performance.avgRating}/5.0)`,
                data: { avgRating: data.performance.avgRating }
            });
        } else if (data.performance.performanceLevel === 'needs_improvement') {
            insights.push({
                type: 'alert',
                category: 'performance',
                message: `Torre requiere atención - promedio bajo (${data.performance.avgRating}/5.0)`,
                data: { avgRating: data.performance.avgRating }
            });
        }

        // Insight 2: Tendencia temporal
        if (data.trends.trend === 'improving') {
            insights.push({
                type: 'strength',
                category: 'trend',
                message: `Tendencia positiva - mejora del ${data.trends.changeFromPrevious}% vs período anterior`,
                data: { changePercentage: data.trends.changeFromPrevious }
            });
        } else if (data.trends.trend === 'declining') {
            insights.push({
                type: 'alert',
                category: 'trend',
                message: `Tendencia negativa - declive del ${Math.abs(data.trends.changeFromPrevious)}% vs período anterior`,
                data: { changePercentage: data.trends.changeFromPrevious }
            });
        }

        // Insight 3: Cobertura de evaluación
        if (data.towerInfo.coveragePercentage < 80) {
            insights.push({
                type: 'opportunity',
                category: 'coverage',
                message: `Oportunidad de mejora - solo ${data.towerInfo.coveragePercentage}% de técnicos evaluados`,
                data: { coveragePercentage: data.towerInfo.coveragePercentage }
            });
        } else if (data.towerInfo.coveragePercentage === 100) {
            insights.push({
                type: 'strength',
                category: 'coverage',
                message: `Excelente cobertura - 100% de técnicos evaluados`,
                data: { coveragePercentage: data.towerInfo.coveragePercentage }
            });
        }

        // Insight 4: Técnicos destacados
        const excellentTechnicians = data.technicians.filter(t => t.performanceLevel === 'excellent');
        const strugglingTechnicians = data.technicians.filter(t => t.performanceLevel === 'needs_improvement');

        if (excellentTechnicians.length > 0) {
            insights.push({
                type: 'strength',
                category: 'technicians',
                message: `${excellentTechnicians.length} técnico(s) con desempeño excelente: ${excellentTechnicians.map(t => t.technicianName).join(', ')}`,
                data: { excellentTechnicians: excellentTechnicians.map(t => ({ name: t.technicianName, rating: t.avgRating })) }
            });
        }

        if (strugglingTechnicians.length > 0) {
            insights.push({
                type: 'alert',
                category: 'technicians',
                message: `${strugglingTechnicians.length} técnico(s) necesitan apoyo: ${strugglingTechnicians.map(t => t.technicianName).join(', ')}`,
                data: { strugglingTechnicians: strugglingTechnicians.map(t => ({ name: t.technicianName, rating: t.avgRating })) }
            });
        }

        // Insight 5: Áreas de mejora por pregunta
        const weakQuestions = data.questionBreakdown.filter(q => q.performanceLevel === 'needs_improvement');
        const strongQuestions = data.questionBreakdown.filter(q => q.performanceLevel === 'excellent');

        if (strongQuestions.length > 0) {
            insights.push({
                type: 'strength',
                category: 'questions',
                message: `Fortalezas identificadas en: ${strongQuestions.map(q => q.questionText).join(', ')}`,
                data: { strongQuestions: strongQuestions.map(q => ({ question: q.questionText, rating: q.avgRating })) }
            });
        }

        if (weakQuestions.length > 0) {
            insights.push({
                type: 'opportunity',
                category: 'questions',
                message: `Oportunidades de mejora en: ${weakQuestions.map(q => q.questionText).join(', ')}`,
                data: { weakQuestions: weakQuestions.map(q => ({ question: q.questionText, rating: q.avgRating })) }
            });
        }

        return insights;
    }

    private async getTowerBasicInfo(towerId: number, formId: string, currentPeriod: string) {
        const tower = await this.towerRepository.findOne({
            where: { id: towerId }
        });

        const totalTechnicians = await this.technicianRepository.count({
            where: { towerId }
        });

        let evaluatedTechnicians = 0;
        if (currentPeriod) {
            const evaluated = await this.questionResponseRepository
                .createQueryBuilder('qr')
                .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                .leftJoin('technicians', 't', 't.id = qr.technician_id')
                .select('COUNT(DISTINCT qr.technician_id)', 'count')
                .where('fr.form_id = :formId', { formId })
                .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
                .andWhere('t.tower_id = :towerId', { towerId })
                .andWhere('qr.technician_id IS NOT NULL')
                .getRawOne();

            evaluatedTechnicians = parseInt(evaluated?.count || '0');
        }

        return {
            id: tower!.id,
            name: tower!.name,
            totalTechnicians,
            evaluatedTechnicians,
            coveragePercentage: totalTechnicians > 0
                ? Math.round((evaluatedTechnicians / totalTechnicians) * 100)
                : 0
        };
    }


    private async getTowerTrends(formId: string, towerId: number, periods: string[]) {
        if (periods.length === 0) {
            return {
                periodData: [],
                changeFromPrevious: 0,
                trend: 'stable' as const,
                bestPeriod: null,
                worstPeriod: null
            };
        }

        // Obtener datos por período
        const periodData = await Promise.all(
            periods.map(async (period) => {
                const metrics = await this.getTowerMetricsForPeriod(formId, towerId, period);
                return {
                    period,
                    avgRating: metrics.avgRating,
                    responseCount: metrics.responseCount,
                    techniciansEvaluated: metrics.uniqueTechnicians
                };
            })
        );

        // Calcular cambio vs período anterior
        let changeFromPrevious = 0;
        let trend: 'improving' | 'declining' | 'stable' = 'stable';

        if (periodData.length >= 2) {
            const current = periodData[0];
            const previous = periodData[1];

            if (current.avgRating > 0 && previous.avgRating > 0) {
                changeFromPrevious = Math.round(((current.avgRating - previous.avgRating) / previous.avgRating) * 10000) / 100;

                if (changeFromPrevious > 5) trend = 'improving';
                else if (changeFromPrevious < -5) trend = 'declining';
                else trend = 'stable';
            }
        }

        // Encontrar mejor y peor período
        const periodsWithData = periodData.filter(p => p.avgRating > 0);
        const bestPeriod = periodsWithData.length > 0
            ? periodsWithData.reduce((best, current) => current.avgRating > best.avgRating ? current : best).period
            : null;
        const worstPeriod = periodsWithData.length > 0
            ? periodsWithData.reduce((worst, current) => current.avgRating < worst.avgRating ? current : worst).period
            : null;

        return {
            periodData,
            changeFromPrevious,
            trend,
            bestPeriod,
            worstPeriod
        };
    }

    private async getTowerTechniciansAnalysis(formId: string, towerId: number, currentPeriod: string) {
        if (!currentPeriod) return [];

        // Obtener todos los técnicos de la torre
        const technicians = await this.technicianRepository.find({
            where: { towerId }
        });

        const techniciansAnalysis = await Promise.all(
            technicians.map(async (technician) => {
                // Calcular promedio del técnico en el período actual
                const technicianMetrics = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .leftJoin('questions', 'q', 'q.id = qr.question_id')
                    .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
                    .addSelect('COUNT(qr.value)', 'totalEvaluations')
                    .addSelect('MAX(fr.submitted_at)', 'lastEvaluation')
                    .where('qr.technician_id = :technicianId', { technicianId: technician.id })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
                    .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .getRawOne();

                const avgRating = technicianMetrics?.avgRating ? parseFloat(technicianMetrics.avgRating) : 0;
                const totalEvaluations = parseInt(technicianMetrics?.totalEvaluations || '0');

                // Determinar nivel de performance
                let performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
                if (avgRating >= 4.5) performanceLevel = 'excellent';
                else if (avgRating >= 4.0) performanceLevel = 'good';
                else if (avgRating >= 3.0) performanceLevel = 'average';
                else performanceLevel = 'needs_improvement';

                return {
                    technicianId: technician.id,
                    technicianName: technician.name,
                    avgRating: Math.round(avgRating * 100) / 100,
                    totalEvaluations,
                    lastEvaluation: technicianMetrics?.lastEvaluation || null,
                    performanceLevel,
                    rankInTower: 0 // Se calculará después
                };
            })
        );

        // Calcular ranking dentro de la torre (solo técnicos con evaluaciones)
        const techniciansWithEvaluations = techniciansAnalysis.filter(t => t.totalEvaluations > 0);
        techniciansWithEvaluations.sort((a, b) => b.avgRating - a.avgRating);

        techniciansWithEvaluations.forEach((tech, index) => {
            const techInArray = techniciansAnalysis.find(t => t.technicianId === tech.technicianId);
            if (techInArray) {
                techInArray.rankInTower = index + 1;
            }
        });

        return techniciansAnalysis.sort((a, b) => b.avgRating - a.avgRating);
    }

    private async getTowerQuestionBreakdown(formId: string, towerId: number, currentPeriod: string) {
        if (!currentPeriod) return [];

        // Obtener preguntas de rating del formulario
        const questions = await this.questionRepository.find({
            where: {
                formId,
                questionType: QuestionType.RATING
            },
            order: { position: 'ASC' }
        });

        const questionBreakdown = await Promise.all(
            questions.map(async (question) => {
                const result = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .leftJoin('technicians', 't', 't.id = qr.technician_id')
                    .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
                    .addSelect('COUNT(qr.value)', 'responseCount')
                    .where('qr.question_id = :questionId', { questionId: question.id })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
                    .andWhere('t.tower_id = :towerId', { towerId })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .getRawOne();

                const avgRating = result?.avgRating ? parseFloat(result.avgRating) : 0;

                // Determinar nivel de performance
                let performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
                if (avgRating >= 4.5) performanceLevel = 'excellent';
                else if (avgRating >= 4.0) performanceLevel = 'good';
                else if (avgRating >= 3.0) performanceLevel = 'average';
                else performanceLevel = 'needs_improvement';

                return {
                    questionId: question.id,
                    questionText: question.questionText,
                    position: question.position,
                    avgRating: Math.round(avgRating * 100) / 100,
                    responseCount: parseInt(result?.responseCount || '0'),
                    performanceLevel
                };
            })
        );

        return questionBreakdown;
    }


    //------------------------------------------------------------------------------------------------------------------------------------------



    async getTechnicianAnalysis(formId: string, technicianId: string, months: number = 6, user: RequestUser): Promise<TechnicianAnalysisResponseDto> {
        // Verificar que el formulario existe
        const form = await this.formRepository.findOne({
            where: { id: formId }
        });

        if (!form) {
            throw new NotFoundException('Formulario no encontrado');
        }

        // Verificar que el técnico existe
        const technician = await this.technicianRepository.findOne({
            where: { id: technicianId },
            relations: ['tower']
        });

        if (!technician) {
            throw new NotFoundException('Técnico no encontrado');
        }

        // Obtener períodos disponibles
        const periods = await this.getAvailablePeriods(formId, months);
        const currentPeriod = periods[0];

        // Obtener información básica del técnico
        const technicianInfo = await this.getTechnicianBasicInfo(technicianId, formId, currentPeriod);

        // Obtener performance actual
        const performance = await this.getTechnicianPerformance(formId, technicianId, currentPeriod);

        // Obtener tendencias temporales
        const trends = await this.getTechnicianTrends(formId, technicianId, periods);

        // Obtener desglose por preguntas
        const questionBreakdown = await this.getTechnicianQuestionBreakdown(formId, technicianId, currentPeriod);

        // Obtener análisis de evaluadores
        const evaluators = await this.getTechnicianEvaluators(formId, technicianId, currentPeriod);

        // Obtener comparación con la torre
        const towerComparison = await this.getTechnicianTowerComparison(formId, technicianId, currentPeriod);

        // Generar insights específicos del técnico
        const insights = await this.generateTechnicianInsights(formId, technicianId, currentPeriod, {
            technicianInfo,
            performance,
            trends,
            questionBreakdown,
            evaluators,
            towerComparison
        });

        return {
            technicianInfo,
            performance,
            trends,
            questionBreakdown,
            evaluators,
            towerComparison,
            insights
        };
    }


    private async getTechnicianBasicInfo(technicianId: string, formId: string, currentPeriod: string) {
        const technician = await this.technicianRepository.findOne({
            where: { id: technicianId },
            relations: ['tower']
        });

        let totalEvaluationsReceived = 0;
        let lastEvaluation = null;

        if (currentPeriod) {
            // Contar evaluaciones recibidas en todos los períodos
            const evaluationStats = await this.questionResponseRepository
                .createQueryBuilder('qr')
                .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                .select('COUNT(DISTINCT fr.id)', 'totalEvaluations')
                .addSelect('MAX(fr.submitted_at)', 'lastEvaluation')
                .where('qr.technician_id = :technicianId', { technicianId })
                .andWhere('fr.form_id = :formId', { formId })
                .getRawOne();

            totalEvaluationsReceived = parseInt(evaluationStats?.totalEvaluations || '0');
            lastEvaluation = evaluationStats?.lastEvaluation || null;
        }

        return {
            id: technician!.id,
            name: technician!.name,
            tower: {
                id: technician!.tower!.id,
                name: technician!.tower!.name
            },
            totalEvaluationsReceived,
            lastEvaluation,
            status: totalEvaluationsReceived > 0 ? 'active' as const : 'inactive' as const
        };
    }

    private async getTechnicianPerformance(formId: string, technicianId: string, currentPeriod: string) {
        if (!currentPeriod) {
            return {
                currentAvgRating: 0,
                totalResponsesReceived: 0,
                responsesByPeriod: 0,
                performanceLevel: 'needs_improvement' as const,
                rankInTower: 0,
                totalTechniciansInTower: 0
            };
        }

        // Obtener métricas del técnico en el período actual
        const technicianMetrics = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
            .addSelect('COUNT(qr.value)', 'responseCount')
            .where('qr.technician_id = :technicianId', { technicianId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .getRawOne();

        const currentAvgRating = technicianMetrics?.avgRating ? parseFloat(technicianMetrics.avgRating) : 0;
        const responsesByPeriod = parseInt(technicianMetrics?.responseCount || '0');

        // Obtener métricas totales (todos los períodos)
        const totalMetrics = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('COUNT(qr.value)', 'totalResponses')
            .where('qr.technician_id = :technicianId', { technicianId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .getRawOne();

        const totalResponsesReceived = parseInt(totalMetrics?.totalResponses || '0');

        // Determinar nivel de performance
        let performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
        if (currentAvgRating >= 4.5) performanceLevel = 'excellent';
        else if (currentAvgRating >= 4.0) performanceLevel = 'good';
        else if (currentAvgRating >= 3.0) performanceLevel = 'average';
        else performanceLevel = 'needs_improvement';

        // Obtener ranking en la torre
        const technician = await this.technicianRepository.findOne({
            where: { id: technicianId },
            relations: ['tower']
        });

        const towerTechnicians = await this.getTowerTechniciansAnalysis(formId, technician!.tower!.id, currentPeriod);
        const technicianPosition = towerTechnicians.findIndex(t => t.technicianId === technicianId) + 1;

        return {
            currentAvgRating: Math.round(currentAvgRating * 100) / 100,
            totalResponsesReceived,
            responsesByPeriod,
            performanceLevel,
            rankInTower: technicianPosition || 0,
            totalTechniciansInTower: towerTechnicians.length
        };
    }

    private async getTechnicianTrends(formId: string, technicianId: string, periods: string[]) {
        if (periods.length === 0) {
            return {
                periodData: [],
                changeFromPrevious: 0,
                trend: 'stable' as const,
                bestPeriod: null,
                worstPeriod: null,
                consistencyScore: 0
            };
        }

        // Obtener datos por período
        const periodData = await Promise.all(
            periods.map(async (period) => {
                const metrics = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .leftJoin('questions', 'q', 'q.id = qr.question_id')
                    .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
                    .addSelect('COUNT(qr.value)', 'responseCount')
                    .addSelect('COUNT(DISTINCT fr.user_id)', 'evaluatorsCount')
                    .where('qr.technician_id = :technicianId', { technicianId })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period })
                    .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .getRawOne();

                return {
                    period,
                    avgRating: metrics?.avgRating ? Math.round(parseFloat(metrics.avgRating) * 100) / 100 : 0,
                    responseCount: parseInt(metrics?.responseCount || '0'),
                    evaluatorsCount: parseInt(metrics?.evaluatorsCount || '0')
                };
            })
        );

        // Calcular cambio vs período anterior
        let changeFromPrevious = 0;
        let trend: 'improving' | 'declining' | 'stable' = 'stable';

        if (periodData.length >= 2) {
            const current = periodData[0];
            const previous = periodData[1];

            if (current.avgRating > 0 && previous.avgRating > 0) {
                changeFromPrevious = Math.round(((current.avgRating - previous.avgRating) / previous.avgRating) * 10000) / 100;

                if (changeFromPrevious > 5) trend = 'improving';
                else if (changeFromPrevious < -5) trend = 'declining';
                else trend = 'stable';
            }
        }

        // Encontrar mejor y peor período
        const periodsWithData = periodData.filter(p => p.avgRating > 0);
        const bestPeriod = periodsWithData.length > 0
            ? periodsWithData.reduce((best, current) => current.avgRating > best.avgRating ? current : best).period
            : null;
        const worstPeriod = periodsWithData.length > 0
            ? periodsWithData.reduce((worst, current) => current.avgRating < worst.avgRating ? current : worst).period
            : null;

        // Calcular score de consistencia (desviación estándar inversa)
        let consistencyScore = 0;
        if (periodsWithData.length > 1) {
            const ratings = periodsWithData.map(p => p.avgRating);
            const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
            const stdDev = Math.sqrt(variance);
            consistencyScore = Math.max(0, Math.round((1 - (stdDev / 5)) * 100)); // 0-100 score
        }

        return {
            periodData,
            changeFromPrevious,
            trend,
            bestPeriod,
            worstPeriod,
            consistencyScore
        };
    }

    private async getTechnicianQuestionBreakdown(formId: string, technicianId: string, currentPeriod: string) {
        if (!currentPeriod) return [];

        // Obtener preguntas de rating del formulario
        const questions = await this.questionRepository.find({
            where: {
                formId,
                questionType: QuestionType.RATING
            },
            order: { position: 'ASC' }
        });

        const questionBreakdown = await Promise.all(
            questions.map(async (question) => {
                const result = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
                    .addSelect('COUNT(qr.value)', 'responseCount')
                    .where('qr.question_id = :questionId', { questionId: question.id })
                    .andWhere('qr.technician_id = :technicianId', { technicianId })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .getRawOne();

                const avgRating = result?.avgRating ? parseFloat(result.avgRating) : 0;

                // Determinar nivel de performance
                let performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
                if (avgRating >= 4.5) performanceLevel = 'excellent';
                else if (avgRating >= 4.0) performanceLevel = 'good';
                else if (avgRating >= 3.0) performanceLevel = 'average';
                else performanceLevel = 'needs_improvement';

                return {
                    questionId: question.id,
                    questionText: question.questionText,
                    position: question.position,
                    avgRating: Math.round(avgRating * 100) / 100,
                    responseCount: parseInt(result?.responseCount || '0'),
                    performanceLevel,
                    isStrength: avgRating >= 4.5,
                    isWeakness: avgRating < 3.0
                };
            })
        );

        return questionBreakdown;
    }

    private async getTechnicianEvaluators(formId: string, technicianId: string, currentPeriod: string) {
        if (!currentPeriod) return [];

        // Obtener evaluadores que han evaluado a este técnico
        const evaluators = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('users', 'u', 'u.id = fr.user_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('u.id', 'evaluatorId')
            .addSelect('u.name', 'evaluatorName')
            .addSelect('AVG(CAST(qr.value AS DECIMAL))', 'avgRatingGiven')
            .addSelect('COUNT(DISTINCT fr.id)', 'evaluationsCount')
            .addSelect('MAX(fr.submitted_at)', 'lastEvaluation')
            .where('qr.technician_id = :technicianId', { technicianId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .andWhere('u.id IS NOT NULL')
            .groupBy('u.id, u.name')
            .getRawMany();

        // Calcular promedio general del técnico para comparar consistencia
        const technicianOverallRating = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
            .where('qr.technician_id = :technicianId', { technicianId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .getRawOne();

        const overallRating = technicianOverallRating?.avgRating ? parseFloat(technicianOverallRating.avgRating) : 0;

        return evaluators.map(evaluator => {
            const evaluatorRating = parseFloat(evaluator.avgRatingGiven);
            const difference = Math.abs(evaluatorRating - overallRating);

            let consistencyWithOthers: 'high' | 'medium' | 'low';
            if (difference <= 0.3) consistencyWithOthers = 'high';
            else if (difference <= 0.7) consistencyWithOthers = 'medium';
            else consistencyWithOthers = 'low';

            return {
                evaluatorId: evaluator.evaluatorId,
                evaluatorName: evaluator.evaluatorName,
                avgRatingGiven: Math.round(evaluatorRating * 100) / 100,
                evaluationsCount: parseInt(evaluator.evaluationsCount),
                lastEvaluation: evaluator.lastEvaluation,
                consistencyWithOthers
            };
        });
    }

    private async getTechnicianTowerComparison(formId: string, technicianId: string, currentPeriod: string) {
        if (!currentPeriod) {
            return {
                positionInTower: 0,
                totalInTower: 0,
                avgRatingVsTowerAvg: 0,
                performsAboveTowerAverage: false,
                topPerformerInTower: false,
                bottomPerformerInTower: false
            };
        }

        // Obtener torre del técnico
        const technician = await this.technicianRepository.findOne({
            where: { id: technicianId },
            relations: ['tower']
        });

        if (!technician) {
            throw new NotFoundException('Técnico no encontrado');
        }

        // Obtener análisis de todos los técnicos de la torre
        const towerTechnicians = await this.getTowerTechniciansAnalysis(formId, technician.tower!.id, currentPeriod);

        // Encontrar la posición del técnico
        const technicianIndex = towerTechnicians.findIndex(t => t.technicianId === technicianId);
        const technicianData = towerTechnicians[technicianIndex];

        // Calcular promedio de la torre
        const towerAverage = towerTechnicians.length > 0
            ? towerTechnicians.reduce((sum, t) => sum + t.avgRating, 0) / towerTechnicians.length
            : 0;

        const avgRatingVsTowerAvg = technicianData ? technicianData.avgRating - towerAverage : 0;

        return {
            positionInTower: technicianIndex >= 0 ? technicianIndex + 1 : 0,
            totalInTower: towerTechnicians.length,
            avgRatingVsTowerAvg: Math.round(avgRatingVsTowerAvg * 100) / 100,
            performsAboveTowerAverage: avgRatingVsTowerAvg > 0,
            topPerformerInTower: technicianIndex === 0 && towerTechnicians.length > 1,
            bottomPerformerInTower: technicianIndex === towerTechnicians.length - 1 && towerTechnicians.length > 1
        };
    }

    private async generateTechnicianInsights(formId: string, technicianId: string, currentPeriod: string, data: any) {
        const insights: Array<{
            type: 'strength' | 'opportunity' | 'alert' | 'recommendation';
            category: string;
            message: string;
            priority: 'high' | 'medium' | 'low';
            data?: any;
        }> = [];

        // Insight 1: Performance general
        if (data.performance.performanceLevel === 'excellent') {
            insights.push({
                type: 'strength',
                category: 'performance',
                message: `Técnico con desempeño excelente (${data.performance.currentAvgRating}/5.0)`,
                priority: 'medium',
                data: { avgRating: data.performance.currentAvgRating }
            });
        } else if (data.performance.performanceLevel === 'needs_improvement') {
            insights.push({
                type: 'alert',
                category: 'performance',
                message: `Técnico requiere atención urgente - promedio bajo (${data.performance.currentAvgRating}/5.0)`,
                priority: 'high',
                data: { avgRating: data.performance.currentAvgRating }
            });
        }

        // Insight 2: Posición en la torre
        if (data.towerComparison.topPerformerInTower) {
            insights.push({
                type: 'strength',
                category: 'ranking',
                message: `🏆 Mejor técnico de su torre "${data.technicianInfo.tower.name}"`,
                priority: 'medium',
                data: { position: data.towerComparison.positionInTower }
            });
        } else if (data.towerComparison.bottomPerformerInTower) {
            insights.push({
                type: 'alert',
                category: 'ranking',
                message: `Técnico con menor rendimiento en su torre - necesita apoyo`,
                priority: 'high',
                data: { position: data.towerComparison.positionInTower }
            });
        }

        // Insight 3: Tendencia
        if (data.trends.trend === 'improving') {
            insights.push({
                type: 'strength',
                category: 'trend',
                message: `Tendencia positiva - mejora del ${data.trends.changeFromPrevious}% vs período anterior`,
                priority: 'low',
                data: { changePercentage: data.trends.changeFromPrevious }
            });
        } else if (data.trends.trend === 'declining') {
            insights.push({
                type: 'alert',
                category: 'trend',
                message: `Tendencia negativa - declive del ${Math.abs(data.trends.changeFromPrevious)}% vs período anterior`,
                priority: 'high',
                data: { changePercentage: data.trends.changeFromPrevious }
            });
        }

        // Insight 4: Consistencia
        if (data.trends.periodData.length > 1) {
            if (data.trends.consistencyScore >= 80) {
                insights.push({
                    type: 'strength',
                    category: 'consistency',
                    message: `Rendimiento muy consistente (${data.trends.consistencyScore}% consistencia)`,
                    priority: 'low',
                    data: { consistencyScore: data.trends.consistencyScore }
                });
            } else if (data.trends.consistencyScore < 50) {
                insights.push({
                    type: 'opportunity',
                    category: 'consistency',
                    message: `Rendimiento inconsistente - revisar factores que afectan performance`,
                    priority: 'medium',
                    data: { consistencyScore: data.trends.consistencyScore }
                });
            }
        }

        // Insight 5: Fortalezas por pregunta
        const strengths = data.questionBreakdown.filter(q => q.isStrength);
        const weaknesses = data.questionBreakdown.filter(q => q.isWeakness);

        if (strengths.length > 0) {
            insights.push({
                type: 'strength',
                category: 'skills',
                message: `Fortalezas destacadas en: ${strengths.map(s => s.questionText).join(', ')}`,
                priority: 'low',
                data: { strengths: strengths.map(s => ({ skill: s.questionText, rating: s.avgRating })) }
            });
        }

        if (weaknesses.length > 0) {
            insights.push({
                type: 'recommendation',
                category: 'development',
                message: `Oportunidades de desarrollo en: ${weaknesses.map(w => w.questionText).join(', ')}`,
                priority: 'high',
                data: { developmentAreas: weaknesses.map(w => ({ skill: w.questionText, rating: w.avgRating })) }
            });
        }

        // Insight 6: Evaluadores inconsistentes
        const inconsistentEvaluators = data.evaluators.filter(e => e.consistencyWithOthers === 'low');
        if (inconsistentEvaluators.length > 0) {
            insights.push({
                type: 'opportunity',
                category: 'evaluation',
                message: `Revisar criterios de evaluación - algunos evaluadores difieren significativamente`,
                priority: 'medium',
                data: { inconsistentEvaluators: inconsistentEvaluators.map(e => e.evaluatorName) }
            });
        }

        // Insight 7: Falta de evaluaciones
        if (data.performance.responsesByPeriod === 0) {
            insights.push({
                type: 'alert',
                category: 'evaluation',
                message: `Técnico no ha sido evaluado en el período actual`,
                priority: 'high',
                data: { lastEvaluation: data.technicianInfo.lastEvaluation }
            });
        }

        return insights.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }



    //------------------------------------------------------------------------------------------------------------------------------------------

    async getEvaluatorAnalysis(formId: string, evaluatorId: string, months: number = 6, user: RequestUser): Promise<EvaluatorAnalysisResponseDto> {
        // Verificar que el formulario existe
        const form = await this.formRepository.findOne({
            where: { id: formId }
        });

        if (!form) {
            throw new NotFoundException('Formulario no encontrado');
        }

        // Verificar que el evaluador existe
        const evaluator = await this.userRepository.findOne({
            where: { id: evaluatorId }
        });

        if (!evaluator) {
            throw new NotFoundException('Evaluador no encontrado');
        }

        // Obtener períodos disponibles
        const periods = await this.getAvailablePeriods(formId, months);
        const currentPeriod = periods[0];

        // Obtener información básica del evaluador
        const evaluatorInfo = await this.getEvaluatorBasicInfo(evaluatorId, formId);

        // Obtener métricas de performance
        const performance = await this.getEvaluatorPerformance(formId, evaluatorId, currentPeriod, periods);

        // Obtener patrones de calificación
        const ratingPatterns = await this.getEvaluatorRatingPatterns(formId, evaluatorId, currentPeriod);

        // Obtener tendencias temporales
        const temporalTrends = await this.getEvaluatorTemporalTrends(formId, evaluatorId, periods);

        // Obtener técnicos evaluados
        const techniciansEvaluated = await this.getEvaluatorTechniciansAnalysis(formId, evaluatorId, currentPeriod);

        // Obtener desglose por preguntas
        const questionBreakdown = await this.getEvaluatorQuestionBreakdown(formId, evaluatorId, currentPeriod);

        // Obtener comparación con otros evaluadores
        const comparisonWithPeers = await this.getEvaluatorPeerComparison(formId, evaluatorId, currentPeriod);

        // Generar insights específicos del evaluador
        const insights = await this.generateEvaluatorInsights(formId, evaluatorId, currentPeriod, {
            evaluatorInfo,
            performance,
            ratingPatterns,
            temporalTrends,
            techniciansEvaluated,
            questionBreakdown,
            comparisonWithPeers
        });

        return {
            evaluatorInfo: {
                id: evaluatorInfo.id,
                name: evaluatorInfo.name,
                role: evaluatorInfo.role.toString(), // Convert Role enum to string
                assignedTechnicians: evaluatorInfo.assignedTechnicians,
                totalEvaluationsGiven: evaluatorInfo.totalEvaluationsGiven,
                firstEvaluation: evaluatorInfo.firstEvaluation,
                lastEvaluation: evaluatorInfo.lastEvaluation,
                status: evaluatorInfo.status
            },
            performance,
            ratingPatterns,
            temporalTrends,
            techniciansEvaluated,
            questionBreakdown,
            comparisonWithPeers,
            insights
        };
    }


    // 🔧 MÉTODOS AUXILIARES PARA EVALUATOR ANALYSIS

    private async getEvaluatorBasicInfo(evaluatorId: string, formId: string) {
        const evaluator = await this.userRepository.findOne({
            where: { id: evaluatorId }
        });

        // Contar técnicos asignados
        const assignedTechnicians = await this.userRepository
            .createQueryBuilder('u')
            .leftJoin('evaluator_technician_map', 'etm', 'etm.evaluator_id = u.id')
            .select('COUNT(etm.technician_id)', 'count')
            .where('u.id = :evaluatorId', { evaluatorId })
            .getRawOne();

        // Contar evaluaciones totales dadas
        const evaluationStats = await this.formResponseRepository
            .createQueryBuilder('fr')
            .select('COUNT(fr.id)', 'totalEvaluations')
            .addSelect('MIN(fr.submitted_at)', 'firstEvaluation')
            .addSelect('MAX(fr.submitted_at)', 'lastEvaluation')
            .where('fr.user_id = :evaluatorId', { evaluatorId })
            .andWhere('fr.form_id = :formId', { formId })
            .getRawOne();

        const totalEvaluationsGiven = parseInt(evaluationStats?.totalEvaluations || '0');
        const daysSinceLastEvaluation = evaluationStats?.lastEvaluation
            ? Math.floor((new Date().getTime() - new Date(evaluationStats.lastEvaluation).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        // Determinar status
        let status: 'active' | 'inactive' | 'overdue';
        if (!evaluationStats?.lastEvaluation) status = 'inactive';
        else if (daysSinceLastEvaluation !== null && daysSinceLastEvaluation > 30) status = 'overdue';
        else status = 'active';

        return {
            id: evaluator!.id,
            name: evaluator!.name,
            role: evaluator!.role || 'evaluador',
            assignedTechnicians: parseInt(assignedTechnicians?.count || '0'),
            totalEvaluationsGiven,
            firstEvaluation: evaluationStats?.firstEvaluation || null,
            lastEvaluation: evaluationStats?.lastEvaluation || null,
            status
        };
    }

    private async getEvaluatorPerformance(formId: string, evaluatorId: string, currentPeriod: string, periods: string[]) {
        if (!currentPeriod) {
            return {
                coveragePercentage: 0,
                evaluatedTechnicians: 0,
                avgResponseTime: 0,
                completionRate: 0,
                currentPeriodStatus: 'pending' as const,
                evaluationFrequency: 'low' as const
            };
        }

        // Obtener cobertura actual
        const assignedTechnicians = await this.userRepository
            .createQueryBuilder('u')
            .leftJoin('evaluator_technician_map', 'etm', 'etm.evaluator_id = u.id')
            .select('COUNT(etm.technician_id)', 'count')
            .where('u.id = :evaluatorId', { evaluatorId })
            .getRawOne();

        const evaluatedTechnicians = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .select('COUNT(DISTINCT qr.technician_id)', 'count')
            .where('fr.user_id = :evaluatorId', { evaluatorId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('qr.technician_id IS NOT NULL')
            .getRawOne();

        const assigned = parseInt(assignedTechnicians?.count || '0');
        const evaluated = parseInt(evaluatedTechnicians?.count || '0');
        const coveragePercentage = assigned > 0 ? Math.round((evaluated / assigned) * 100) : 0;

        // Calcular tiempo promedio de respuesta (días entre evaluaciones)
        const evaluationDates = await this.formResponseRepository
            .createQueryBuilder('fr')
            .select('fr.submitted_at')
            .where('fr.user_id = :evaluatorId', { evaluatorId })
            .andWhere('fr.form_id = :formId', { formId })
            .orderBy('fr.submitted_at', 'ASC')
            .getRawMany();

        let avgResponseTime = 0;
        if (evaluationDates.length > 1) {
            const intervals: number[] = [];
            for (let i = 1; i < evaluationDates.length; i++) {
                const diff = Math.floor(
                    (new Date(evaluationDates[i].submitted_at).getTime() -
                        new Date(evaluationDates[i - 1].submitted_at).getTime()) / (1000 * 60 * 60 * 24)
                );
                intervals.push(diff);
            }
            avgResponseTime = Math.round(intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length);
        }

        // Calcular tasa de completitud (% de períodos donde evaluó)
        const periodsWithEvaluations = await this.formResponseRepository
            .createQueryBuilder('fr')
            .select('DISTINCT fr.evaluation_period')
            .where('fr.user_id = :evaluatorId', { evaluatorId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period IN (:...periods)', { periods })
            .getRawMany();

        const completionRate = periods.length > 0
            ? Math.round((periodsWithEvaluations.length / periods.length) * 100)
            : 0;

        // Status del período actual
        let currentPeriodStatus: 'completed' | 'partial' | 'pending';
        if (coveragePercentage >= 100) currentPeriodStatus = 'completed';
        else if (coveragePercentage > 0) currentPeriodStatus = 'partial';
        else currentPeriodStatus = 'pending';

        // Frecuencia de evaluación
        let evaluationFrequency: 'high' | 'medium' | 'low';
        if (avgResponseTime <= 7) evaluationFrequency = 'high';
        else if (avgResponseTime <= 15) evaluationFrequency = 'medium';
        else evaluationFrequency = 'low';

        return {
            coveragePercentage,
            evaluatedTechnicians: evaluated,
            avgResponseTime,
            completionRate,
            currentPeriodStatus,
            evaluationFrequency
        };
    }

    private async getEvaluatorRatingPatterns(formId: string, evaluatorId: string, currentPeriod: string) {
        if (!currentPeriod) {
            return {
                avgRatingGiven: 0,
                ratingDistribution: [],
                mostCommonRating: 0,
                ratingRange: { min: 0, max: 0, spread: 0 },
                evaluationStyle: 'balanced' as const,
                consistencyScore: 0
            };
        }

        // Obtener todas las calificaciones dadas por el evaluador
        const ratings = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('CAST(qr.value AS INTEGER)', 'rating')
            .where('fr.user_id = :evaluatorId', { evaluatorId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .getRawMany();

        if (ratings.length === 0) {
            return {
                avgRatingGiven: 0,
                ratingDistribution: [],
                mostCommonRating: 0,
                ratingRange: { min: 0, max: 0, spread: 0 },
                evaluationStyle: 'balanced' as const,
                consistencyScore: 0
            };
        }

        const ratingValues = ratings.map(r => r.rating);
        const avgRatingGiven = Math.round((ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length) * 100) / 100;

        // Distribución de calificaciones
        const distribution = [1, 2, 3, 4, 5].map(rating => {
            const count = ratingValues.filter(r => r === rating).length;
            return {
                rating,
                count,
                percentage: Math.round((count / ratingValues.length) * 100)
            };
        });

        const mostCommonRating = distribution.reduce((max, current) =>
            current.count > max.count ? current : max
        ).rating;

        const min = Math.min(...ratingValues);
        const max = Math.max(...ratingValues);
        const spread = max - min;

        // Determinar estilo de evaluación
        let evaluationStyle: 'strict' | 'balanced' | 'generous' | 'inconsistent';
        if (avgRatingGiven < 3.0) evaluationStyle = 'strict';
        else if (avgRatingGiven > 4.5) evaluationStyle = 'generous';
        else if (spread >= 3) evaluationStyle = 'inconsistent';
        else evaluationStyle = 'balanced';

        // Score de consistencia (basado en desviación estándar)
        const mean = avgRatingGiven;
        const variance = ratingValues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratingValues.length;
        const stdDev = Math.sqrt(variance);
        const consistencyScore = Math.max(0, Math.round((1 - (stdDev / 2)) * 100));

        return {
            avgRatingGiven,
            ratingDistribution: distribution,
            mostCommonRating,
            ratingRange: { min, max, spread },
            evaluationStyle,
            consistencyScore
        };
    }

    private async getEvaluatorTemporalTrends(formId: string, evaluatorId: string, periods: string[]) {
        if (periods.length === 0) {
            return {
                periodData: [],
                activityTrend: 'stable' as const,
                ratingTrend: 'stable' as const,
                mostActiveMonth: null,
                leastActiveMonth: null
            };
        }

        // Obtener datos por período
        const periodData = await Promise.all(
            periods.map(async (period) => {
                const periodStats = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .leftJoin('questions', 'q', 'q.id = qr.question_id')
                    .select('COUNT(DISTINCT qr.technician_id)', 'techniciansEvaluated')
                    .addSelect('AVG(CAST(qr.value AS DECIMAL))', 'avgRatingGiven')
                    .addSelect('COUNT(DISTINCT fr.id)', 'evaluationsCount')
                    .where('fr.user_id = :evaluatorId', { evaluatorId })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period })
                    .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .getRawOne();

                // Calcular cobertura para este período
                const assignedTechnicians = await this.userRepository
                    .createQueryBuilder('u')
                    .leftJoin('evaluator_technician_map', 'etm', 'etm.evaluator_id = u.id')
                    .select('COUNT(etm.technician_id)', 'count')
                    .where('u.id = :evaluatorId', { evaluatorId })
                    .getRawOne();

                const assigned = parseInt(assignedTechnicians?.count || '0');
                const evaluated = parseInt(periodStats?.techniciansEvaluated || '0');

                return {
                    period,
                    techniciansEvaluated: evaluated,
                    avgRatingGiven: periodStats?.avgRatingGiven ?
                        Math.round(parseFloat(periodStats.avgRatingGiven) * 100) / 100 : 0,
                    evaluationsCount: parseInt(periodStats?.evaluationsCount || '0'),
                    coveragePercentage: assigned > 0 ? Math.round((evaluated / assigned) * 100) : 0
                };
            })
        );

        // Determinar tendencias
        let activityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        let ratingTrend: 'becoming_stricter' | 'becoming_generous' | 'stable' = 'stable';

        if (periodData.length >= 2) {
            const recent = periodData.slice(0, Math.ceil(periodData.length / 2));
            const older = periodData.slice(Math.ceil(periodData.length / 2));

            const recentAvgActivity = recent.reduce((sum, p) => sum + p.techniciansEvaluated, 0) / recent.length;
            const olderAvgActivity = older.reduce((sum, p) => sum + p.techniciansEvaluated, 0) / older.length;

            const recentAvgRating = recent.filter(p => p.avgRatingGiven > 0)
                .reduce((sum, p) => sum + p.avgRatingGiven, 0) / recent.filter(p => p.avgRatingGiven > 0).length || 0;
            const olderAvgRating = older.filter(p => p.avgRatingGiven > 0)
                .reduce((sum, p) => sum + p.avgRatingGiven, 0) / older.filter(p => p.avgRatingGiven > 0).length || 0;

            if (recentAvgActivity > olderAvgActivity * 1.1) activityTrend = 'increasing';
            else if (recentAvgActivity < olderAvgActivity * 0.9) activityTrend = 'decreasing';

            if (recentAvgRating > 0 && olderAvgRating > 0) {
                if (recentAvgRating > olderAvgRating * 1.05) ratingTrend = 'becoming_generous';
                else if (recentAvgRating < olderAvgRating * 0.95) ratingTrend = 'becoming_stricter';
            }
        }

        // Encontrar períodos más y menos activos
        const periodsWithActivity = periodData.filter(p => p.techniciansEvaluated > 0);
        const mostActiveMonth = periodsWithActivity.length > 0 ?
            periodsWithActivity.reduce((max, current) =>
                current.techniciansEvaluated > max.techniciansEvaluated ? current : max
            ).period : null;

        const leastActiveMonth = periodsWithActivity.length > 0 ?
            periodsWithActivity.reduce((min, current) =>
                current.techniciansEvaluated < min.techniciansEvaluated ? current : min
            ).period : null;

        return {
            periodData,
            activityTrend,
            ratingTrend,
            mostActiveMonth,
            leastActiveMonth
        };
    }

    private async getEvaluatorTechniciansAnalysis(formId: string, evaluatorId: string, currentPeriod: string) {
        if (!currentPeriod) return [];

        // Obtener técnicos evaluados por este evaluador
        const techniciansData = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('technicians', 't', 't.id = qr.technician_id')
            .leftJoin('towers', 'tower', 'tower.id = t.tower_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('t.id', 'technicianId')
            .addSelect('t.name', 'technicianName')
            .addSelect('tower.name', 'towerName')
            .addSelect('AVG(CAST(qr.value AS DECIMAL))', 'avgRatingGiven')
            .addSelect('COUNT(DISTINCT fr.id)', 'evaluationsCount')
            .addSelect('MAX(fr.submitted_at)', 'lastEvaluation')
            .where('fr.user_id = :evaluatorId', { evaluatorId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .andWhere('qr.technician_id IS NOT NULL')
            .groupBy('t.id, t.name, tower.name')
            .getRawMany();

        // Para cada técnico, calcular consistencia y comparación con otros evaluadores
        const techniciansAnalysis = await Promise.all(
            techniciansData.map(async (tech) => {
                const avgRatingGiven = Math.round(parseFloat(tech.avgRatingGiven) * 100) / 100;

                // Obtener calificaciones del evaluador para este técnico
                const evaluatorRatings = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .leftJoin('questions', 'q', 'q.id = qr.question_id')
                    .select('CAST(qr.value AS INTEGER)', 'rating')
                    .where('fr.user_id = :evaluatorId', { evaluatorId })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
                    .andWhere('qr.technician_id = :technicianId', { technicianId: tech.technicianId })
                    .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .getRawMany();

                // Calcular consistencia (desviación estándar)
                let ratingConsistency: 'high' | 'medium' | 'low' = 'high';
                if (evaluatorRatings.length > 1) {
                    const ratings = evaluatorRatings.map(r => r.rating);
                    const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
                    const stdDev = Math.sqrt(variance);

                    if (stdDev > 1.0) ratingConsistency = 'low';
                    else if (stdDev > 0.5) ratingConsistency = 'medium';
                    else ratingConsistency = 'high';
                }

                // Comparar con otros evaluadores del mismo técnico
                const otherEvaluatorsAvg = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .leftJoin('questions', 'q', 'q.id = qr.question_id')
                    .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
                    .where('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
                    .andWhere('qr.technician_id = :technicianId', { technicianId: tech.technicianId })
                    .andWhere('fr.user_id != :evaluatorId', { evaluatorId })
                    .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .getRawOne();

                let comparedToOthers: 'above_average' | 'average' | 'below_average' = 'average';
                if (otherEvaluatorsAvg?.avgRating) {
                    const othersAvg = parseFloat(otherEvaluatorsAvg.avgRating);
                    const difference = avgRatingGiven - othersAvg;

                    if (difference > 0.3) comparedToOthers = 'above_average';
                    else if (difference < -0.3) comparedToOthers = 'below_average';
                    else comparedToOthers = 'average';
                }

                return {
                    technicianId: tech.technicianId,
                    technicianName: tech.technicianName,
                    towerName: tech.towerName,
                    avgRatingGiven,
                    evaluationsCount: parseInt(tech.evaluationsCount),
                    lastEvaluation: tech.lastEvaluation,
                    ratingConsistency,
                    comparedToOthers
                };
            })
        );

        return techniciansAnalysis.sort((a, b) => b.avgRatingGiven - a.avgRatingGiven);
    }

    private async getEvaluatorQuestionBreakdown(formId: string, evaluatorId: string, currentPeriod: string) {
        if (!currentPeriod) return [];

        // Obtener preguntas de rating del formulario
        const questions = await this.questionRepository.find({
            where: {
                formId,
                questionType: QuestionType.RATING
            },
            order: { position: 'ASC' }
        });

        const questionBreakdown = await Promise.all(
            questions.map(async (question) => {
                const result = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRatingGiven')
                    .addSelect('COUNT(qr.value)', 'responseCount')
                    .where('qr.question_id = :questionId', { questionId: question.id })
                    .andWhere('fr.user_id = :evaluatorId', { evaluatorId })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .getRawOne();

                const avgRatingGiven = result?.avgRatingGiven ?
                    Math.round(parseFloat(result.avgRatingGiven) * 100) / 100 : 0;

                return {
                    questionId: question.id,
                    questionText: question.questionText,
                    position: question.position,
                    avgRatingGiven,
                    responseCount: parseInt(result?.responseCount || '0'),
                    isStrictestQuestion: false, // Se calculará después
                    isGenerousQuestion: false // Se calculará después
                };
            })
        );

        // Determinar pregunta más estricta y más generosa
        const questionsWithData = questionBreakdown.filter(q => q.responseCount > 0);
        if (questionsWithData.length > 0) {
            const strictest = questionsWithData.reduce((min, current) =>
                current.avgRatingGiven < min.avgRatingGiven ? current : min
            );
            const mostGenerous = questionsWithData.reduce((max, current) =>
                current.avgRatingGiven > max.avgRatingGiven ? current : max
            );

            strictest.isStrictestQuestion = true;
            mostGenerous.isGenerousQuestion = true;
        }

        return questionBreakdown;
    }

    private async getEvaluatorPeerComparison(formId: string, evaluatorId: string, currentPeriod: string) {
        if (!currentPeriod) {
            return {
                avgRatingVsPeers: 0,
                coverageVsPeers: 0,
                activityVsPeers: 0,
                isStricterThanPeers: false,
                isMoreActiveThanPeers: false,
                rankInCoverage: 0,
                totalEvaluators: 0
            };
        }

        // Obtener métricas de todos los evaluadores
        const allEvaluators = await this.getEvaluatorsSummary(formId, currentPeriod);
        const currentEvaluator = allEvaluators.find(e => e.evaluatorId === evaluatorId);

        if (!currentEvaluator || allEvaluators.length === 0) {
            return {
                avgRatingVsPeers: 0,
                coverageVsPeers: 0,
                activityVsPeers: 0,
                isStricterThanPeers: false,
                isMoreActiveThanPeers: false,
                rankInCoverage: 0,
                totalEvaluators: allEvaluators.length
            };
        }

        // Calcular promedios de peers (excluyendo al evaluador actual)
        const peers = allEvaluators.filter(e => e.evaluatorId !== evaluatorId);

        const peerAvgCoverage = peers.length > 0
            ? peers.reduce((sum, e) => sum + e.coveragePercentage, 0) / peers.length
            : 0;

        const peerAvgActivity = peers.length > 0
            ? peers.reduce((sum, e) => sum + e.evaluationsCompleted, 0) / peers.length
            : 0;

        // Obtener promedio de calificaciones del evaluador vs peers
        const evaluatorAvgRating = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
            .where('fr.user_id = :evaluatorId', { evaluatorId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .getRawOne();

        const peersAvgRating = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
            .where('fr.user_id != :evaluatorId', { evaluatorId })
            .andWhere('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period: currentPeriod })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .getRawOne();

        const currentRating = evaluatorAvgRating?.avgRating ? parseFloat(evaluatorAvgRating.avgRating) : 0;
        const peersRating = peersAvgRating?.avgRating ? parseFloat(peersAvgRating.avgRating) : 0;

        // Ranking en cobertura
        const rankInCoverage = allEvaluators.findIndex(e => e.evaluatorId === evaluatorId) + 1;

        return {
            avgRatingVsPeers: Math.round((currentRating - peersRating) * 100) / 100,
            coverageVsPeers: Math.round((currentEvaluator.coveragePercentage - peerAvgCoverage) * 100) / 100,
            activityVsPeers: Math.round((currentEvaluator.evaluationsCompleted - peerAvgActivity) * 100) / 100,
            isStricterThanPeers: currentRating < peersRating - 0.2,
            isMoreActiveThanPeers: currentEvaluator.evaluationsCompleted > peerAvgActivity,
            rankInCoverage,
            totalEvaluators: allEvaluators.length
        };
    }

    private async generateEvaluatorInsights(formId: string, evaluatorId: string, currentPeriod: string, data: any) {
        const insights: Array<{
            type: 'strength' | 'opportunity' | 'alert' | 'recommendation';
            category: string;
            message: string;
            priority: 'high' | 'medium' | 'low';
            actionable: boolean;
            data?: any;
        }> = [];

        // Insight 1: Cobertura
        if (data.performance.coveragePercentage >= 100) {
            insights.push({
                type: 'strength',
                category: 'coverage',
                message: `Excelente cobertura - evaluó al 100% de técnicos asignados`,
                priority: 'low',
                actionable: false,
                data: { coveragePercentage: data.performance.coveragePercentage }
            });
        } else if (data.performance.coveragePercentage < 70) {
            insights.push({
                type: 'alert',
                category: 'coverage',
                message: `Cobertura insuficiente - solo evaluó al ${data.performance.coveragePercentage}% de técnicos asignados`,
                priority: 'high',
                actionable: true,
                data: {
                    coveragePercentage: data.performance.coveragePercentage,
                    missing: data.evaluatorInfo.assignedTechnicians - data.performance.evaluatedTechnicians
                }
            });
        }

        // Insight 2: Actividad temporal
        if (data.temporalTrends.activityTrend === 'decreasing') {
            insights.push({
                type: 'alert',
                category: 'activity',
                message: `Tendencia decreciente en actividad de evaluación`,
                priority: 'medium',
                actionable: true,
                data: { trend: data.temporalTrends.activityTrend }
            });
        } else if (data.temporalTrends.activityTrend === 'increasing') {
            insights.push({
                type: 'strength',
                category: 'activity',
                message: `Tendencia positiva - incrementando actividad de evaluación`,
                priority: 'low',
                actionable: false,
                data: { trend: data.temporalTrends.activityTrend }
            });
        }

        // Insight 3: Estilo de evaluación
        if (data.ratingPatterns.evaluationStyle === 'strict') {
            insights.push({
                type: 'opportunity',
                category: 'rating_style',
                message: `Estilo de evaluación estricto (promedio ${data.ratingPatterns.avgRatingGiven}) - considerar calibración`,
                priority: 'medium',
                actionable: true,
                data: {
                    avgRating: data.ratingPatterns.avgRatingGiven,
                    style: data.ratingPatterns.evaluationStyle
                }
            });
        } else if (data.ratingPatterns.evaluationStyle === 'generous') {
            insights.push({
                type: 'opportunity',
                category: 'rating_style',
                message: `Estilo de evaluación generoso (promedio ${data.ratingPatterns.avgRatingGiven}) - considerar calibración`,
                priority: 'medium',
                actionable: true,
                data: {
                    avgRating: data.ratingPatterns.avgRatingGiven,
                    style: data.ratingPatterns.evaluationStyle
                }
            });
        } else if (data.ratingPatterns.evaluationStyle === 'inconsistent') {
            insights.push({
                type: 'alert',
                category: 'consistency',
                message: `Evaluaciones inconsistentes - rango muy amplio en calificaciones`,
                priority: 'high',
                actionable: true,
                data: {
                    spread: data.ratingPatterns.ratingRange.spread,
                    consistencyScore: data.ratingPatterns.consistencyScore
                }
            });
        }

        // Insight 4: Comparación con peers
        if (data.comparisonWithPeers.isStricterThanPeers) {
            insights.push({
                type: 'opportunity',
                category: 'peer_comparison',
                message: `Más estricto que otros evaluadores (${Math.abs(data.comparisonWithPeers.avgRatingVsPeers)} puntos menos)`,
                priority: 'medium',
                actionable: true,
                data: { ratingDifference: data.comparisonWithPeers.avgRatingVsPeers }
            });
        }

        if (data.comparisonWithPeers.rankInCoverage === 1) {
            insights.push({
                type: 'strength',
                category: 'peer_comparison',
                message: `🏆 Líder en cobertura entre todos los evaluadores`,
                priority: 'low',
                actionable: false,
                data: { rank: data.comparisonWithPeers.rankInCoverage }
            });
        } else if (data.comparisonWithPeers.rankInCoverage > data.comparisonWithPeers.totalEvaluators * 0.7) {
            insights.push({
                type: 'alert',
                category: 'peer_comparison',
                message: `Ranking bajo en cobertura (posición ${data.comparisonWithPeers.rankInCoverage} de ${data.comparisonWithPeers.totalEvaluators})`,
                priority: 'high',
                actionable: true,
                data: { rank: data.comparisonWithPeers.rankInCoverage }
            });
        }

        // Insight 5: Frecuencia de evaluación
        if (data.performance.evaluationFrequency === 'low') {
            insights.push({
                type: 'recommendation',
                category: 'frequency',
                message: `Frecuencia de evaluación baja (${data.performance.avgResponseTime} días promedio) - considerar mayor regularidad`,
                priority: 'medium',
                actionable: true,
                data: { avgResponseTime: data.performance.avgResponseTime }
            });
        } else if (data.performance.evaluationFrequency === 'high') {
            insights.push({
                type: 'strength',
                category: 'frequency',
                message: `Excelente frecuencia de evaluación (${data.performance.avgResponseTime} días promedio)`,
                priority: 'low',
                actionable: false,
                data: { avgResponseTime: data.performance.avgResponseTime }
            });
        }

        // Insight 6: Técnicos con inconsistencias
        const inconsistentTechnicians = data.techniciansEvaluated.filter(t => t.ratingConsistency === 'low');
        if (inconsistentTechnicians.length > 0) {
            insights.push({
                type: 'opportunity',
                category: 'technician_consistency',
                message: `${inconsistentTechnicians.length} técnico(s) con calificaciones inconsistentes`,
                priority: 'medium',
                actionable: true,
                data: {
                    inconsistentTechnicians: inconsistentTechnicians.map(t => t.technicianName)
                }
            });
        }

        // Insight 7: Status inactivo
        if (data.evaluatorInfo.status === 'overdue') {
            insights.push({
                type: 'alert',
                category: 'activity',
                message: `Evaluador inactivo por período prolongado`,
                priority: 'high',
                actionable: true,
                data: {
                    lastEvaluation: data.evaluatorInfo.lastEvaluation,
                    status: data.evaluatorInfo.status
                }
            });
        }

        return insights.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const actionableOrder = { true: 1, false: 0 };

            if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return actionableOrder[String(b.actionable)] - actionableOrder[String(a.actionable)];
        });
    }




    //------------------------------------------------------------------------------------------------------------------------------------------

    async getTowersComparison(formId: string, period: string, user: RequestUser): Promise<TowersComparisonResponseDto> {
        // Verificar que el formulario existe
        const form = await this.formRepository.findOne({
            where: { id: formId }
        });

        if (!form) {
            throw new NotFoundException('Formulario no encontrado');
        }

        // Si no se especifica período, usar el más reciente
        let evaluationPeriod = period;
        if (!evaluationPeriod) {
            const periods = await this.getAvailablePeriods(formId, 1);
            evaluationPeriod = periods[0];
        }

        if (!evaluationPeriod) {
            throw new NotFoundException('No hay períodos de evaluación disponibles');
        }

        // Obtener resumen general
        const overview = await this.getTowersComparisonOverview(formId, evaluationPeriod);

        // Obtener ranking de torres
        const ranking = await this.getTowersRanking(formId, evaluationPeriod);

        // Obtener distribución de performance
        const performanceDistribution = await this.getTowersPerformanceDistribution(ranking);

        // Obtener análisis de cobertura
        const coverageAnalysis = await this.getTowersCoverageAnalysis(ranking);

        // Obtener top performers
        const topPerformers = await this.getTowersTopPerformers(formId, evaluationPeriod, ranking);

        // Obtener desglose por preguntas
        const questionBreakdown = await this.getTowersQuestionBreakdown(formId, evaluationPeriod);

        // Generar insights comparativos
        const insights = await this.generateTowersComparisonInsights(formId, evaluationPeriod, {
            overview,
            ranking,
            performanceDistribution,
            coverageAnalysis,
            topPerformers,
            questionBreakdown
        });

        // Generar recomendaciones
        const recommendations = await this.generateTowersRecommendations(formId, evaluationPeriod, {
            ranking,
            performanceDistribution,
            coverageAnalysis,
            questionBreakdown
        });

        return {
            overview,
            ranking,
            performanceDistribution,
            coverageAnalysis,
            topPerformers,
            questionBreakdown,
            insights,
            recommendations
        };
    }



    private async getTowersComparisonOverview(formId: string, period: string) {
        // Obtener estadísticas generales
        const overviewStats = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('technicians', 't', 't.id = qr.technician_id')
            .leftJoin('towers', 'tower', 'tower.id = t.tower_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('COUNT(DISTINCT tower.id)', 'totalTowers')
            .addSelect('COUNT(DISTINCT t.id)', 'totalTechnicians')
            .addSelect('COUNT(DISTINCT fr.id)', 'totalEvaluationsCompleted')
            .addSelect('AVG(CAST(qr.value AS DECIMAL))', 'overallAvgRating')
            .addSelect('MAX(fr.submitted_at)', 'lastUpdated')
            .where('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .andWhere('qr.technician_id IS NOT NULL')
            .getRawOne();

        return {
            totalTowers: parseInt(overviewStats?.totalTowers || '0'),
            evaluationPeriod: period,
            totalTechnicians: parseInt(overviewStats?.totalTechnicians || '0'),
            totalEvaluationsCompleted: parseInt(overviewStats?.totalEvaluationsCompleted || '0'),
            overallAvgRating: overviewStats?.overallAvgRating ?
                Math.round(parseFloat(overviewStats.overallAvgRating) * 100) / 100 : 0,
            lastUpdated: overviewStats?.lastUpdated || new Date()
        };
    }

    private async getTowersRanking(formId: string, period: string) {
        // Obtener métricas por torre
        const towerMetrics = await this.questionResponseRepository
            .createQueryBuilder('qr')
            .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
            .leftJoin('technicians', 't', 't.id = qr.technician_id')
            .leftJoin('towers', 'tower', 'tower.id = t.tower_id')
            .leftJoin('questions', 'q', 'q.id = qr.question_id')
            .select('tower.id', 'towerId')
            .addSelect('tower.name', 'towerName')
            .addSelect('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
            .addSelect('COUNT(DISTINCT t.id)', 'evaluatedTechnicians')
            .addSelect('COUNT(DISTINCT fr.id)', 'totalResponses')
            .where('fr.form_id = :formId', { formId })
            .andWhere('fr.evaluation_period = :period', { period })
            .andWhere('q.question_type = :questionType', { questionType: QuestionType.RATING })
            .andWhere('qr.value ~ \'^[1-5]$\'')
            .andWhere('qr.technician_id IS NOT NULL')
            .groupBy('tower.id, tower.name')
            .orderBy('AVG(CAST(qr.value AS DECIMAL))', 'DESC')
            .getRawMany();

        // Para cada torre, obtener técnicos totales y calcular cobertura
        const ranking = await Promise.all(
            towerMetrics.map(async (tower, index) => {
                // Contar técnicos totales de la torre
                const totalTechnicians = await this.technicianRepository.count({
                    where: { tower: { id: tower.towerId } }
                });

                const avgRating = Math.round(parseFloat(tower.avgRating) * 100) / 100;
                const evaluatedTechnicians = parseInt(tower.evaluatedTechnicians);
                const coveragePercentage = totalTechnicians > 0 ?
                    Math.round((evaluatedTechnicians / totalTechnicians) * 100) : 0;

                // Determinar nivel de performance
                let performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
                if (avgRating >= 4.5) performanceLevel = 'excellent';
                else if (avgRating >= 4.0) performanceLevel = 'good';
                else if (avgRating >= 3.0) performanceLevel = 'average';
                else performanceLevel = 'needs_improvement';

                // TODO: Calcular cambio vs período anterior (implementar después)
                const changeFromPrevious = null; // Placeholder
                const trend = 'stable' as const; // Placeholder

                return {
                    position: index + 1,
                    towerId: tower.towerId,
                    towerName: tower.towerName,
                    avgRating,
                    totalTechnicians,
                    evaluatedTechnicians,
                    coveragePercentage,
                    totalResponses: parseInt(tower.totalResponses),
                    performanceLevel,
                    changeFromPrevious,
                    trend
                };
            })
        );

        return ranking;
    }

    private async getTowersPerformanceDistribution(ranking: any[]) {
        const distribution = {
            excellent: { count: 0, towers: [], percentage: 0 },
            good: { count: 0, towers: [], percentage: 0 },
            average: { count: 0, towers: [], percentage: 0 },
            needs_improvement: { count: 0, towers: [], percentage: 0 }
        };

        ranking.forEach(tower => {
            distribution[tower.performanceLevel].count++;
            distribution[tower.performanceLevel].towers.push(tower.towerName);
        });

        const total = ranking.length;
        Object.keys(distribution).forEach(level => {
            distribution[level].percentage = total > 0 ?
                Math.round((distribution[level].count / total) * 100) : 0;
        });

        return distribution;
    }

    private async getTowersCoverageAnalysis(ranking: any[]) {
        const fullCoverage = ranking.filter(t => t.coveragePercentage === 100).map(t => t.towerName);
        const partialCoverage = ranking.filter(t => t.coveragePercentage >= 70 && t.coveragePercentage < 100).map(t => t.towerName);
        const lowCoverage = ranking.filter(t => t.coveragePercentage < 70).map(t => t.towerName);

        const avgCoverageByTower = ranking.map(tower => ({
            towerName: tower.towerName,
            coveragePercentage: tower.coveragePercentage
        })).sort((a, b) => b.coveragePercentage - a.coveragePercentage);

        return {
            fullCoverage,
            partialCoverage,
            lowCoverage,
            avgCoverageByTower
        };
    }

    private async getTowersTopPerformers(formId: string, period: string, ranking: any[]) {
        const topPerformers: TopPerformer[] = [];

        // Validar que el ranking no esté vacío
    if (ranking.length === 0) {
        console.log('⚠️ No hay datos de ranking para generar top performers');
        return topPerformers; // Retornar array vacío si no hay datos
    }

        // Mejor calificada
        if (ranking.length > 0) {
            const highest = ranking[0];
            topPerformers.push({
                category: 'highest_rated' as const,
                towerName: highest.towerName,
                value: highest.avgRating,
                description: `Torre con mejor promedio de calificación (${highest.avgRating}/5.0)`
            });
        }

        // Mejor cobertura
        const bestCoverage = ranking.reduce((best, current) =>
            current.coveragePercentage > best.coveragePercentage ? current : best
        , ranking[0]);
        topPerformers.push({
            category: 'best_coverage' as const,
            towerName: bestCoverage.towerName,
            value: bestCoverage.coveragePercentage,
            description: `Torre con mejor cobertura de evaluación (${bestCoverage.coveragePercentage}%)`
        });

        // TODO: Implementar más categorías (más mejorada, más consistente)
        // Placeholders por ahora
        topPerformers.push({
            category: 'most_improved' as const,
            towerName: 'TBD',
            value: 0,
            description: 'Pendiente de implementar análisis temporal'
        });

        topPerformers.push({
            category: 'most_consistent' as const,
            towerName: 'TBD',
            value: 0,
            description: 'Pendiente de implementar análisis de consistencia'
        });

        return topPerformers.filter(tp => tp.towerName !== 'TBD');
    }

    private async getTowersQuestionBreakdown(formId: string, period: string) {
        // Obtener preguntas de rating del formulario
        const questions = await this.questionRepository.find({
            where: {
                formId,
                questionType: QuestionType.RATING
            },
            order: { position: 'ASC' }
        });

        const questionBreakdown = await Promise.all(
            questions.map(async (question) => {
                // Obtener performance por torre para esta pregunta
                const towerPerformanceData = await this.questionResponseRepository
                    .createQueryBuilder('qr')
                    .leftJoin('form_responses', 'fr', 'fr.id = qr.form_response_id')
                    .leftJoin('technicians', 't', 't.id = qr.technician_id')
                    .leftJoin('towers', 'tower', 'tower.id = t.tower_id')
                    .select('tower.name', 'towerName')
                    .addSelect('AVG(CAST(qr.value AS DECIMAL))', 'avgRating')
                    .where('qr.question_id = :questionId', { questionId: question.id })
                    .andWhere('fr.form_id = :formId', { formId })
                    .andWhere('fr.evaluation_period = :period', { period })
                    .andWhere('qr.value ~ \'^[1-5]$\'')
                    .andWhere('qr.technician_id IS NOT NULL')
                    .groupBy('tower.name')
                    .getRawMany();

                const towerPerformance = towerPerformanceData.map(tp => ({
                    towerName: tp.towerName,
                    avgRating: Math.round(parseFloat(tp.avgRating) * 100) / 100,
                    isStrongest: false,
                    isWeakest: false
                }));

                // Identificar mejor y peor torre para esta pregunta
                if (towerPerformance.length > 0) {
                    const strongest = towerPerformance.reduce((max, current) =>
                        current.avgRating > max.avgRating ? current : max
                    );
                    const weakest = towerPerformance.reduce((min, current) =>
                        current.avgRating < min.avgRating ? current : min
                    );

                    strongest.isStrongest = true;
                    if (strongest !== weakest) {
                        weakest.isWeakest = true;
                    }
                }

                // Calcular promedio general y gap de performance
                const overallAvgRating = towerPerformance.length > 0 ?
                    Math.round((towerPerformance.reduce((sum, tp) => sum + tp.avgRating, 0) / towerPerformance.length) * 100) / 100 : 0;

                const performanceGap = towerPerformance.length > 0 ?
                    Math.round((Math.max(...towerPerformance.map(tp => tp.avgRating)) -
                        Math.min(...towerPerformance.map(tp => tp.avgRating))) * 100) / 100 : 0;

                return {
                    questionId: question.id,
                    questionText: question.questionText,
                    position: question.position,
                    overallAvgRating,
                    towerPerformance,
                    performanceGap
                };
            })
        );

        return questionBreakdown;
    }

    private async generateTowersComparisonInsights(formId: string, period: string, data: any) {
        const insights: Array<{
            type: 'strength' | 'opportunity' | 'alert' | 'recommendation';
            category: string;
            message: string;
            priority: 'high' | 'medium' | 'low';
            affectedTowers: string[];
            data?: any;
        }> = [];

        // Insight 1: Torres con excelente performance
        const excellentTowers = data.ranking.filter(t => t.performanceLevel === 'excellent');
        if (excellentTowers.length > 0) {
            insights.push({
                type: 'strength',
                category: 'performance',
                message: `${excellentTowers.length} torre(s) con desempeño excelente`,
                priority: 'low',
                affectedTowers: excellentTowers.map(t => t.towerName),
                data: { excellentTowers: excellentTowers.map(t => ({ name: t.towerName, rating: t.avgRating })) }
            });
        }

        // Insight 2: Torres que necesitan atención
        const strugglingTowers = data.ranking.filter(t => t.performanceLevel === 'needs_improvement');
        if (strugglingTowers.length > 0) {
            insights.push({
                type: 'alert',
                category: 'performance',
                message: `${strugglingTowers.length} torre(s) requieren atención inmediata`,
                priority: 'high',
                affectedTowers: strugglingTowers.map(t => t.towerName),
                data: { strugglingTowers: strugglingTowers.map(t => ({ name: t.towerName, rating: t.avgRating })) }
            });
        }

        // Insight 3: Problemas de cobertura
        if (data.coverageAnalysis.lowCoverage.length > 0) {
            insights.push({
                type: 'alert',
                category: 'coverage',
                message: `${data.coverageAnalysis.lowCoverage.length} torre(s) con cobertura insuficiente (<70%)`,
                priority: 'high',
                affectedTowers: data.coverageAnalysis.lowCoverage,
                data: { lowCoverageTowers: data.coverageAnalysis.lowCoverage }
            });
        }

        // Insight 4: Cobertura completa
        if (data.coverageAnalysis.fullCoverage.length > 0) {
            insights.push({
                type: 'strength',
                category: 'coverage',
                message: `${data.coverageAnalysis.fullCoverage.length} torre(s) con cobertura completa (100%)`,
                priority: 'low',
                affectedTowers: data.coverageAnalysis.fullCoverage,
                data: { fullCoverageTowers: data.coverageAnalysis.fullCoverage }
            });
        }

        // Insight 5: Brechas significativas por pregunta
        const significantGaps = data.questionBreakdown.filter(q => q.performanceGap >= 1.5);
        if (significantGaps.length > 0) {
            insights.push({
                type: 'opportunity',
                category: 'skill_gaps',
                message: `Brechas significativas detectadas en ${significantGaps.length} área(s) de evaluación`,
                priority: 'medium',
                affectedTowers: [], // Se especifica en data
                data: {
                    gapAreas: significantGaps.map(q => ({
                        area: q.questionText,
                        gap: q.performanceGap,
                        strongest: q.towerPerformance.find(tp => tp.isStrongest)?.towerName,
                        weakest: q.towerPerformance.find(tp => tp.isWeakest)?.towerName
                    }))
                }
            });
        }

        // Insight 6: Distribución desbalanceada
        const distribution = data.performanceDistribution;
        if (distribution.needs_improvement.percentage > 50) {
            insights.push({
                type: 'alert',
                category: 'distribution',
                message: `Más del 50% de torres requieren mejora (${distribution.needs_improvement.percentage}%)`,
                priority: 'high',
                affectedTowers: distribution.needs_improvement.towers,
                data: { distributionPercentage: distribution.needs_improvement.percentage }
            });
        } else if (distribution.excellent.percentage > 70) {
            insights.push({
                type: 'strength',
                category: 'distribution',
                message: `Excelente distribución: ${distribution.excellent.percentage}% de torres con performance excelente`,
                priority: 'low',
                affectedTowers: distribution.excellent.towers,
                data: { distributionPercentage: distribution.excellent.percentage }
            });
        }

        return insights.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    private async generateTowersRecommendations(formId: string, period: string, data: any) {
        const recommendations: Array<{
            type: 'best_practice' | 'improvement_action' | 'attention_needed';
            title: string;
            description: string;
            targetTowers: string[];
            benchmarkTower: string | null;
            priority: 'high' | 'medium' | 'low';
        }> = [];

        // Recomendación 1: Compartir mejores prácticas
        const topTower = data.ranking[0];
        const strugglingTowers = data.ranking.filter(t => t.performanceLevel === 'needs_improvement');

        if (topTower && strugglingTowers.length > 0) {
            recommendations.push({
                type: 'best_practice',
                title: 'Transferencia de Mejores Prácticas',
                description: `Organizar sesiones de transferencia de conocimiento entre ${topTower.towerName} (líder) y torres con oportunidades de mejora`,
                targetTowers: strugglingTowers.map(t => t.towerName),
                benchmarkTower: topTower.towerName,
                priority: 'high'
            });
        }

        // Recomendación 2: Mejorar cobertura
        if (data.coverageAnalysis.lowCoverage.length > 0) {
            const benchmarkCoverage = data.coverageAnalysis.fullCoverage[0] || null;
            recommendations.push({
                type: 'improvement_action',
                title: 'Plan de Mejora de Cobertura',
                description: 'Implementar estrategias para aumentar la cobertura de evaluación y alcanzar el 100%',
                targetTowers: data.coverageAnalysis.lowCoverage,
                benchmarkTower: benchmarkCoverage,
                priority: 'high'
            });
        }

        // Recomendación 3: Atención a brechas específicas
        const significantGaps = data.questionBreakdown.filter(q => q.performanceGap >= 1.5);
        if (significantGaps.length > 0) {
            significantGaps.forEach(gap => {
                const weakestTowers = gap.towerPerformance
                    .filter(tp => tp.avgRating < gap.overallAvgRating - 0.5)
                    .map(tp => tp.towerName);
                const strongestTower = gap.towerPerformance.find(tp => tp.isStrongest)?.towerName;

                if (weakestTowers.length > 0 && strongestTower) {
                    recommendations.push({
                        type: 'attention_needed',
                        title: `Mejora en ${gap.questionText}`,
                        description: `Enfocar desarrollo específico en esta área donde hay una brecha de ${gap.performanceGap} puntos`,
                        targetTowers: weakestTowers,
                        benchmarkTower: strongestTower,
                        priority: 'medium'
                    });
                }
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }




}
