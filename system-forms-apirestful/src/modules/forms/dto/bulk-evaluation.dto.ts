import { IsArray, IsUUID, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { AnswerDto } from "./submit-form.dto";

export class BulkEvaluationDto {
    @IsUUID()
    formId: string;

    @IsUUID()
    technicianId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnswerDto)
    answers: AnswerDto[];
}

export class BulkSubmitDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkEvaluationDto)
    evaluations: BulkEvaluationDto[];
}