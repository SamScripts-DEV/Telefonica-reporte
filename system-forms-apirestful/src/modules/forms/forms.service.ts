import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Form, FormStatus } from '../../entities/form.entity';
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
  ) {}

  async create(createFormDto: CreateFormDto, user: RequestUser): Promise<Form> {
    const { questions, towerIds, technicianId, ...formData } = createFormDto;

    // Validate technician if provided
    if (technicianId) {
      const technician = await this.technicianRepository.findOne({
        where: { id: technicianId },
      });
      if (!technician) {
        throw new BadRequestException('Invalid technician ID');
      }
    }

    // Create form
    const form = this.formRepository.create({
      ...formData,
      createdBy: user.id,
      technicianId,
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

  async findAll(paginationDto: PaginationDto, user: RequestUser): Promise<PaginatedResult<Form>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

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
}
