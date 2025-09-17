import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Form, FormStatus, FormType } from '../../entities/form.entity';
import { Question } from '../../entities/question.entity';
import { FormResponse } from '../../entities/form-response.entity';
import { QuestionResponse } from '../../entities/question-response.entity';
import { Tower } from '../../entities/tower.entity';
import { Technician } from '../../entities/technician.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { User } from 'src/entities';
import { response } from 'express';
import { BulkSubmitDto } from './dto/bulk-evaluation.dto';
import { BulkSuccess, BulkSkipped, BulkError } from 'src/common/interfaces/results.interface';
import { log } from 'console';


@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form)
    private formRepository: Repository<Form>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(FormResponse)
    private formResponseRepository: Repository<FormResponse>,
    @InjectRepository(QuestionResponse)
    private questionResponseRepository: Repository<QuestionResponse>,
    @InjectRepository(Tower)
    private towerRepository: Repository<Tower>,
    @InjectRepository(Technician)
    private technicianRepository: Repository<Technician>,
    @InjectRepository(User)
    private userRepository: Repository<User>,

  ) { }

  async create(createFormDto: CreateFormDto, user: RequestUser): Promise<Form> {
    const {
      questions,
      towerIds,
      technicianId,
      type,
      startDay,
      endDay,
      autoActivate,
      ...formData
    } = createFormDto;

    // Validate technician if provided
    if (technicianId) {
      const technician = await this.technicianRepository.findOne({
        where: { id: technicianId },
      });
      if (!technician) {
        throw new BadRequestException('Invalid technician ID');
      }
    }

    // Validar campos para formularios periódicos
    if (type === FormType.PERIODIC) {
      if (!startDay || !endDay) {
        throw new BadRequestException('startDay and endDay are required for periodic forms');
      }

      if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
        throw new BadRequestException('startDay and endDay must be between 1 and 31');
      }
    }

    // Establecer valores por defecto para formularios periódicos
    let periodicData = {};
    if (type === FormType.PERIODIC) {
      periodicData = {
        type: FormType.PERIODIC,
        startDay: startDay || 27,
        endDay: endDay || 5,
        autoActivate: autoActivate !== undefined ? autoActivate : true,
        status: FormStatus.DRAFT // Siempre inicia en DRAFT
      };
    } else {
      periodicData = {
        type: FormType.SINGLE,
        startDay: null,
        endDay: null,
        autoActivate: false,
        currentPeriod: null,
        periodStartDate: null,
        periodEndDate: null
      };
    }

    // Create form
    const form = this.formRepository.create({
      ...formData,
      ...periodicData,
      createdBy: user.id,
      technicianId,
      status: formData.status || FormStatus.DRAFT,
    });

    const savedForm = await this.formRepository.save(form);

    // Assign towers if provided
    if (towerIds && towerIds.length > 0) {
      await this.assignTowersToForm(savedForm.id, towerIds);
    }

    // Create questions if provided
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const questionData = {
          ...questions[i],
          formId: savedForm.id,
          position: questions[i].position || i + 1,
        };
        const question = this.questionRepository.create(questionData);
        await this.questionRepository.save(question);
      }
    }

    return this.findOne(savedForm.id, user);
  }

  async findAll(user: RequestUser): Promise<{data: Form[]}> {


    const queryBuilder = this.formRepository
      .createQueryBuilder('form')
      .leftJoinAndSelect('form.creator', 'creator')
      .leftJoinAndSelect('form.technician', 'technician')
      .leftJoinAndSelect('form.towers', 'towers')
      .leftJoinAndSelect('form.questions', 'questions');

    // Filter by user's towers if not dev/superadmin
    if (!['dev', 'superadmin'].includes(user.roleName)) {
      if (user.towerIds.length > 0) {
        queryBuilder
          .innerJoin('form.towers', 'userTowers')
          .where('userTowers.id IN (:...towerIds)', { towerIds: user.towerIds });
      } else {
        queryBuilder.where('1 = 0'); // No access
      }
    }

    const [forms, total] = await queryBuilder
      .orderBy('form.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: forms,
    };
  }

  async findOne(id: string, user?: RequestUser): Promise<Form> {
    const queryBuilder = this.formRepository
      .createQueryBuilder('form')
      .leftJoinAndSelect('form.creator', 'creator')
      .leftJoinAndSelect('form.technician', 'technician')
      .leftJoinAndSelect('form.towers', 'towers')
      .leftJoinAndSelect('form.questions', 'questions')
      .leftJoinAndSelect('form.responses', 'responses')
      .where('form.id = :id', { id });

    // Filter by user's towers if not dev/superadmin
    if (user && !['dev', 'superadmin'].includes(user.roleName)) {
      if (user.towerIds.length > 0) {
        queryBuilder
          .innerJoin('form.towers', 'userTowers')
          .andWhere('userTowers.id IN (:...towerIds)', { towerIds: user.towerIds });
      } else {
        queryBuilder.andWhere('1 = 0'); // No access
      }
    }

    const form = await queryBuilder.getOne();

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  async update(id: string, updateFormDto: UpdateFormDto, user: RequestUser): Promise<Form> {
    const form = await this.findOne(id, user);
    const { towerIds, questions, technicianId, ...updateData } = updateFormDto;

    // Check if user can edit this form
    if (!['dev', 'superadmin'].includes(user.roleName) && form.createdBy !== user.id) {
      throw new ForbiddenException('You can only edit forms you created');
    }

    // Validate technician if provided
    if (technicianId) {
      const technician = await this.technicianRepository.findOne({
        where: { id: technicianId },
      });
      if (!technician) {
        throw new BadRequestException('Invalid technician ID');
      }
    }

    // Update form data
    await this.formRepository.update(id, { ...updateData, technicianId });

    // Update towers if provided
    if (towerIds !== undefined) {
      await this.assignTowersToForm(id, towerIds);
    }

    return this.findOne(id, user);
  }

  async remove(id: string, user: RequestUser): Promise<void> {
    const form = await this.findOne(id, user);

    // Check if user can delete this form
    if (!['dev', 'superadmin'].includes(user.roleName) && form.createdBy !== user.id) {
      throw new ForbiddenException('You can only delete forms you created');
    }

    await this.formRepository.remove(form);
  }

  async assignTowersToForm(formId: string, towerIds: number[]): Promise<void> {
    const form = await this.formRepository.findOne({
      where: { id: formId },
      relations: ['towers'],
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    if (towerIds.length > 0) {
      const towers = await this.towerRepository.findBy({
        id: In(towerIds),
      });

      if (towers.length !== towerIds.length) {
        throw new BadRequestException('Some tower IDs are invalid');
      }

      form.towers = towers;
    } else {
      form.towers = [];
    }

    await this.formRepository.save(form);
  }

  async submitForm(formId: string, submitFormDto: SubmitFormDto, user: RequestUser): Promise<FormResponse> {
    const form = await this.findOne(formId, user);

    // Check if form is active
    if (form.status !== FormStatus.ACTIVE) {
      throw new BadRequestException('Form is not active');
    }

    // Check if user already submitted this form
    const existingResponse = await this.formResponseRepository.findOne({
      where: { formId, userId: user.id },
    });

    if (existingResponse) {
      throw new BadRequestException('You have already submitted this form');
    }

    // Validate required questions
    const requiredQuestions = form.questions.filter(q => q.isRequired);
    const answeredQuestionIds = submitFormDto.answers.map(a => a.questionId);

    for (const requiredQuestion of requiredQuestions) {
      if (!answeredQuestionIds.includes(requiredQuestion.id)) {
        throw new BadRequestException(`Question "${requiredQuestion.questionText}" is required`);
      }
    }

    // Create form response
    const formResponse = this.formResponseRepository.create({
      formId,
      userId: form.isAnonymous ? undefined : user.id,
    });

    const savedResponse = await this.formResponseRepository.save(formResponse);

    // Create question responses
    for (const answer of submitFormDto.answers) {
      const questionResponse = this.questionResponseRepository.create({
        formResponseId: savedResponse.id,
        questionId: answer.questionId,
        value: answer.value,
      });
      await this.questionResponseRepository.save(questionResponse);
    }

    const result = await this.formResponseRepository.findOne({
      where: { id: savedResponse.id },
      relations: ['form', 'user', 'questionResponses', 'questionResponses.question'],
    });

    return result!;
  }

  async getFormResponses(formId: string, user: RequestUser, paginationDto: PaginationDto): Promise<PaginatedResult<FormResponse>> {
    const form = await this.findOne(formId, user);
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [responses, total] = await this.formResponseRepository.findAndCount({
      where: { formId },
      relations: ['user', 'questionResponses', 'questionResponses.question'],
      skip,
      take: limit,
      order: { submittedAt: 'DESC' },
    });

    return {
      data: responses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async changeFormStatus(formId: string, status: FormStatus, user: RequestUser): Promise<Form> {
    const form = await this.findOne(formId, user);

    // Check if user can change status
    if (!['dev', 'superadmin'].includes(user.roleName) && form.createdBy !== user.id) {
      throw new ForbiddenException('You can only change status of forms you created');
    }

    await this.formRepository.update(formId, { status });
    return this.findOne(formId, user);
  }

  async getPendingFormsForUser(paginationDto: PaginationDto, user: RequestUser): Promise<PaginatedResult<Form>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.formRepository
      .createQueryBuilder('form')
      .leftJoinAndSelect('form.creator', 'creator')
      .leftJoinAndSelect('form.technician', 'technician')
      .leftJoinAndSelect('form.towers', 'towers')
      .leftJoinAndSelect('form.questions', 'questions')
      .leftJoin('form.responses', 'responses', 'responses.userId = :userId', { userId: user.id })
      .where('form.status = :status', { status: FormStatus.ACTIVE })
      .andWhere('responses.id IS NULL'); // Solo formularios sin respuesta del usuario

    // Filtrar por torres del usuario si no es dev/superadmin
    if (!['dev', 'superadmin'].includes(user.roleName)) {
      if (user.towerIds && user.towerIds.length > 0) {
        queryBuilder
          .innerJoin('form.towers', 'userTowers')
          .andWhere('userTowers.id IN (:...towerIds)', { towerIds: user.towerIds });
      } else {
        queryBuilder.andWhere('1 = 0'); // Sin acceso si no tiene torres asignadas
      }
    }

    const [forms, total] = await queryBuilder
      .orderBy('form.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: forms,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEvaluationMatrix(towerId: number, user: RequestUser): Promise<any> {
    console.log('USER:', user);

    if (!['dev', 'superadmin'].includes(user.roleName) && !user.towerIds.includes(towerId)) {
      throw new ForbiddenException('You do not have access to this tower');
    }

    const evaluator = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['assignedTechnicians']
    });

    if (!evaluator) {
      throw new NotFoundException('User not found');
    }

    // Filter technicians by tower
    const techniciansInTower = evaluator.assignedTechnicians?.filter(
      tech => tech.towerId === towerId
    ) || [];

    if (techniciansInTower.length === 0) {
      return {
        success: true,
        message: 'No technicians assigned for evaluation in this tower',
        data: {
          towerId,
          technicians: [],
          forms: [],
          matrix: [],
          stats: {
            totalTechnicians: 0,
            totalForms: 0,
            totalEvaluations: 0,
            completedEvaluations: 0,
            progress: 0
          }
        }
      }
    }

    const activeForms = await this.formRepository
      .createQueryBuilder('form')
      .innerJoin('form.towers', 'tower')
      .leftJoinAndSelect('form.questions', 'questions')
      .where('tower.id = :towerId', { towerId })
      .andWhere('form.status = :status', { status: FormStatus.ACTIVE })
      .orderBy('questions.position', 'ASC')
      .getMany()

    if (activeForms.length === 0) {
      return {
        success: true,
        message: 'No active forms available for this tower',
        data: {
          towerId,
          technicians: techniciansInTower,
          forms: [],
          matrix: [],
          stats: {
            totalTechnicians: techniciansInTower.length,
            totalForms: 0,
            totalEvaluations: 0,
            completedEvaluations: 0,
            progress: 0
          }
        }
      }
    }

    // ⭐ CORREGIDO: Buscar evaluaciones considerando períodos
    const completedEvaluations = await this.getCompletedEvaluationsForMatrix(activeForms, user.id);

    const matrix = this.buildEvaluationMatrix(techniciansInTower, activeForms, completedEvaluations);

    const totalEvaluations = techniciansInTower.length * activeForms.length;
    const completedCount = completedEvaluations.length;
    const progress = totalEvaluations > 0 ? Math.round((completedCount / totalEvaluations) * 100) : 0;

    return {
      success: true,
      data: {
        towerId,
        technicians: techniciansInTower,
        forms: activeForms,
        matrix,
        completedEvaluations,
        stats: {
          totalTechnicians: techniciansInTower.length,
          totalForms: activeForms.length,
          totalEvaluations,
          completedEvaluations: completedCount,
          progress
        }
      }
    }
  }

  private async getCompletedEvaluationsForMatrix(activeForms: Form[], userId: string): Promise<any[]> {
    const completedEvaluations: any[] = [];

    for (const form of activeForms) {
      let whereCondition: any = {
        userId: userId,
        formId: form.id
      };

      // ⭐ CLAVE: Para formularios PERIODIC, buscar por período actual
      if (form.type === FormType.PERIODIC) {
        const currentPeriod = this.getEvaluationPeriodForForm(form);
        if (currentPeriod) {
          whereCondition.evaluationPeriod = currentPeriod;
        } else {
          // Si no estamos en período de evaluación, no hay evaluaciones completadas
          continue;
        }
      }

      const evaluation = await this.formResponseRepository.findOne({
        where: whereCondition,
        select: ['formId', 'id', 'submittedAt', 'evaluationPeriod']
      });

      if (evaluation) {
        completedEvaluations.push(evaluation);
      }
    }

    return completedEvaluations;
  }

  private buildEvaluationMatrix(technicians: any[], forms: Form[], completedEvaluations: any[]): any[] {
    return technicians.map(technician => ({
      technician: {
        id: technician.id,
        name: technician.name,
        towerId: technician.towerId,
      },
      evaluations: forms.map(form => {
        // ⭐ CORREGIDO: Buscar evaluación por formId y período (si aplica)
        const isCompleted = completedEvaluations.find(evalua => {
          if (form.type === FormType.PERIODIC) {
            const currentPeriod = this.getEvaluationPeriodForForm(form);
            return evalua.formId === form.id && evalua.evaluationPeriod === currentPeriod;
          } else {
            return evalua.formId === form.id;
          }
        });

        return {
          formId: form.id,
          formTitle: form.title,
          formDescription: form.description,
          formType: form.type, // ⭐ AGREGAR: Útil para debugging
          currentPeriod: form.type === FormType.PERIODIC ? this.getEvaluationPeriodForForm(form) : null, // ⭐ AGREGAR
          isCompleted: !!isCompleted,
          completedAt: isCompleted?.submittedAt || null,
          responseId: isCompleted?.id || null,
          evaluationPeriod: isCompleted?.evaluationPeriod || null, // ⭐ AGREGAR
          questions: form.questions?.map(q => ({
            id: q.id,
            text: q.questionText,
            type: q.questionType,
            isRequired: q.isRequired,
            options: q.options,
            position: q.position
          })) || []
        }
      })
    }))
  }


  async bulkSubmitEvaluations(
    bulkSubmitDto: BulkSubmitDto,
    user: RequestUser
  ): Promise<any> {
    const { evaluations } = bulkSubmitDto;

    // Obtener el formId (asumimos que todos los evaluations tienen el mismo formId)
    const formId = evaluations[0]?.formId;
    if (!formId) throw new BadRequestException('Missing formId in evaluations');

    // Obtener el formulario y validar estado
    const form = await this.findOne(formId, user);
    if (form.status !== FormStatus.ACTIVE) {
      throw new BadRequestException('Form is not active');
    }


    // ⭐ MANEJAR FORMULARIOS PERIÓDICOS
    let evaluationPeriod: string | null = null;
    if (form.type === FormType.PERIODIC) {
      evaluationPeriod = this.getEvaluationPeriodForForm(form);

      if (!evaluationPeriod) {
        throw new BadRequestException('Form is not available outside the evaluation period');
      }

      // Verificar si ya envió evaluaciones en este período
      const existingResponse = await this.formResponseRepository.findOne({
        where: {
          formId,
          userId: user.id,
          evaluationPeriod
        }
      });

      if (existingResponse) {
        throw new BadRequestException(`You have already submitted evaluations for this form in period ${this.getMonthName(evaluationPeriod)}`);
      }
    } else {
      // Para formularios SINGLE (lógica original)
      const existingResponse = await this.formResponseRepository.findOne({
        where: { formId, userId: user.id }
      });

      if (existingResponse) {
        throw new BadRequestException('You have already submitted this form for all technicians');
      }
    }

    // Obtener el usuario y sus técnicos asignados
    const evaluator = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['assignedTechnicians']
    });
    if (!evaluator) throw new NotFoundException('User not found');

    // Filtrar técnicos asignados a la torre del formulario
    const assignedTechnicians = evaluator.assignedTechnicians.filter(
      tech => form.towers.some(tower => tower.id === tech.towerId)
    );
    const assignedTechniciansIds = assignedTechnicians.map(t => t.id);

    // Validar que se envíen todas las evaluaciones requeridas
    const missingTechnicians = assignedTechniciansIds.filter(
      techId => !evaluations.some(ev => ev.technicianId === techId)
    );
    if (missingTechnicians.length > 0) {
      throw new BadRequestException(`Missing evaluations for technicians: ${missingTechnicians.join(', ')}`);
    }

    // Validar que el usuario no haya enviado ya este formulario
    const existingResponse = await this.formResponseRepository.findOne({
      where: { formId, userId: user.id }
    });
    if (existingResponse) {
      throw new BadRequestException('You have already submitted this form for all technicians');
    }

    // Validar preguntas requeridas para cada evaluación
    const requiredQuestions = form.questions.filter(q => q.isRequired);
    for (const evaluation of evaluations) {
      const answeredQuestionIds = evaluation.answers.map(a => a.questionId);
      for (const requiredQuestion of requiredQuestions) {
        if (!answeredQuestionIds.includes(requiredQuestion.id)) {
          throw new BadRequestException(
            `Technician ${evaluation.technicianId}: Question "${requiredQuestion.questionText}" is required`
          );
        }
      }
    }

    // Usar transacción para garantizar atomicidad
    return await this.formResponseRepository.manager.transaction(async transactionalEntityManager => {
      // Crear un solo registro en form_responses
      const formResponse = this.formResponseRepository.create({
        formId,
        userId: form.isAnonymous ? undefined : user.id,
        evaluationPeriod: evaluationPeriod || undefined,
        submittedAt: new Date()
      });
      const savedResponse = await transactionalEntityManager.save(formResponse);

      // Guardar todas las respuestas en question_responses
      for (const evaluation of evaluations) {
        for (const answer of evaluation.answers) {
          const questionResponse = this.questionResponseRepository.create({
            formResponse: savedResponse, // relación, no solo el id
            question: { id: answer.questionId }, // relación, puedes cargar la entidad si lo prefieres
            value: answer.value,
            technician: { id: evaluation.technicianId } // relación, no solo el id
          });
          await transactionalEntityManager.save(questionResponse);
        }
      }

      return {
        success: true,
        responseId: savedResponse.id,
        period: evaluationPeriod,
        message: evaluationPeriod
          ? `All evaluations submitted successfully for period ${this.getMonthName(evaluationPeriod)}`
          : 'All evaluations submitted successfully'
      };
    });
  }

  async getEvaluationProgress(towerId: number, user: RequestUser): Promise<any> {
    const matrixData = await this.getEvaluationMatrix(towerId, user);

    if (!matrixData.success) {
      return matrixData;
    }

    const { matrix, stats } = matrixData.data;

    const progressByTechnician = matrix.map(technicianData => ({
      technician: technicianData.technician,
      progress: {
        completed: technicianData.evaluations.filter(e => e.isCompleted).length,
        total: technicianData.evaluations.length,
        percentage: technicianData.evaluations.length > 0
          ? Math.round(
            (technicianData.evaluations.filter(e => e.isCompleted).length /
              technicianData.evaluations.length) * 100
          )
          : 0
      },
      nextPending: technicianData.evaluations.find(e => !e.isCompleted) || null,
      completedEvaluations: technicianData.evaluations.filter(e => e.isCompleted),
      pendingEvaluations: technicianData.evaluations.filter(e => !e.isCompleted)
    }));

    return {
      success: true,
      data: {
        towerId,
        overallStats: stats,
        progressByTechnician,
        summary: {
          techniciansCompleted: progressByTechnician.filter(p => p.progress.percentage === 100).length,
          techniciansInProgress: progressByTechnician.filter(p => p.progress.percentage > 0 && p.progress.percentage < 100).length,
          techniciansNotStarted: progressByTechnician.filter(p => p.progress.percentage === 0).length
        }
      }
    };
  }

  async checkAndUpdatePeriodicForms(): Promise<void> {
    console.log('🔍 Starting periodic forms check...');

    const periodicForms = await this.formRepository.find({
      where: {
        type: FormType.PERIODIC,
        autoActivate: true,
        isActive: true
      }
    });

    console.log(`📋 Found ${periodicForms.length} periodic forms to check`);

    for (const form of periodicForms) {
      await this.processPeriodicForm(form);
    }

    console.log('✅ Periodic forms check completed');
  }

  private async processPeriodicForm(form: Form): Promise<void> {
    const shouldBeActive = this.shouldFormBeActiveNow(form);
    const currentEvaluationPeriod = this.getEvaluationPeriodForForm(form);

    console.log(`📝 Processing form "${form.title}":`, {
      currentStatus: form.status,
      shouldBeActive,
      currentEvaluationPeriod,
      formCurrentPeriod: form.currentPeriod
    });

    if (shouldBeActive && currentEvaluationPeriod) {
      await this.activateFormForPeriod(form, currentEvaluationPeriod);
    } else {
      await this.deactivateFormIfNeeded(form);
    }
  }

  private async activateFormForPeriod(form: Form, evaluationPeriod: string): Promise<void> {
    const isNewPeriod = form.currentPeriod !== evaluationPeriod;
    const shouldActivate = form.status !== FormStatus.ACTIVE || isNewPeriod;

    if (shouldActivate) {
      const { startDate, endDate } = this.calculatePeriodDates(form);

      await this.formRepository.update(form.id, {
        status: FormStatus.ACTIVE,
        currentPeriod: evaluationPeriod,
        periodStartDate: startDate,
        periodEndDate: endDate
      });

      const periodName = this.getMonthName(evaluationPeriod);
      console.log(`🟢 Form "${form.title}" activated for period ${periodName} (${evaluationPeriod})`);
    }
  }

  private async deactivateFormIfNeeded(form: Form): Promise<void> {
    if (form.status === FormStatus.ACTIVE) {
      await this.formRepository.update(form.id, {
        status: FormStatus.CLOSED
      });
      console.log(`🔴 Form "${form.title}" deactivated (outside evaluation period)`);
    }
  }

  private shouldFormBeActiveNow(form: Form): boolean {
    if (form.type === FormType.SINGLE) {
      return form.status === FormStatus.ACTIVE;
    }

    if (form.type === FormType.PERIODIC) {
      const now = new Date();
      const day = now.getDate();
      const startDay = form.startDay || 27;
      const endDay = form.endDay || 5;

      if (startDay > endDay) {
        return day >= startDay || day <= endDay;
      } else {
        return day >= startDay && day <= endDay;
      }
    }

    return false;
  }

  private calculatePeriodDates(form: Form): { startDate: Date, endDate: Date } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDay = form.startDay || 27;
    const endDay = form.endDay || 5;

    let startDate: Date;
    let endDate: Date;

    if (startDay > endDay) {
      if (now.getDate() >= startDay) {
        startDate = new Date(year, month, startDay);
        endDate = new Date(year, month + 1, endDay);
      } else {
        startDate = new Date(year, month - 1, startDay);
        endDate = new Date(year, month, endDay);
      }
    } else {
      startDate = new Date(year, month, startDay);
      endDate = new Date(year, month, endDay);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }




  //Helpers

  //Obtiene el mes que se esta evaluando. Ejemplo del 27 de enero al 5 de febrero, el mes evaluado es enero
  private getCurrentEvaluationMonth(): string | null {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth(); // 0-based
    const year = now.getFullYear();

    // Si estamos entre el 27 y fin de mes, evaluamos el mes actual
    if (day >= 27) {
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    }
    // Si estamos entre el 1 y el 5, evaluamos el mes anterior
    else if (day <= 5) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      return `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
    }

    // Fuera del período de evaluación
    return null;
  }


  private isWithinEvaluationPeriod(): boolean {
    const now = new Date();
    const day = now.getDate();

    //Activo del 27 al ultimo dia del mes y del 1 al 5 del siguiente mes
    return (day >= 27) || (day <= 5);
  }


  private isFormWithinActivePeriod(form: Form): boolean {
    if (form.type === FormType.SINGLE) {
      return form.status === FormStatus.ACTIVE;
    }

    if (form.type === FormType.PERIODIC) {
      const now = new Date();
      const day = now.getDate();

      // Usar las fechas específicas del formulario
      const startDay = form.startDay || 27;
      const endDay = form.endDay || 5;

      return day >= startDay || day <= endDay;
    }

    return false;
  }

  private getEvaluationPeriodForForm(form: Form): string | null {
    if (form.type === FormType.SINGLE) {
      return null; // Los formularios single no tienen período
    }

    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    const startDay = form.startDay || 27;
    const endDay = form.endDay || 5;

    // Si estamos entre startDay y fin de mes, evaluamos el mes actual
    if (day >= startDay) {
      return `${year}-${String(month + 1).padStart(2, '0')}`;
    }
    // Si estamos entre el 1 y endDay, evaluamos el mes anterior
    else if (day <= endDay) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      return `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
    }

    return null;
  }

  private getMonthName(monthStr: string): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const [year, month] = monthStr.split('-');
    const monthIndex = parseInt(month) - 1;
    return `${months[monthIndex]} ${year}`;
  }






}
