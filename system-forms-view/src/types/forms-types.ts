export interface FormCreateRequest {
  title: string
  description: string
  status: string
  isActive: boolean
  isAnonymous: boolean
  technicianId?: string // ✅ Mantener como opcional
  towerIds: number[]
  questions: QuestionCreateRequest[]
}

export interface QuestionCreateRequest {
  questionText: string
  questionType: "rating" | "text" | "multiple_choice" | "boolean" | "number"
  isRequired: boolean
  position: number
  options: string
}

// ✅ AGREGAR: Tipos para las respuestas
export interface FormAnswer {
  questionId: string;
  value: string | number;
}

export interface FormSubmissionRequest {
  answers: FormAnswer[];
}

export interface FormSubmissionResponse {
  id: string;
  formId: string;
  submittedBy: string;
  submittedAt: string;
  form: {
    id: string;
    title: string;
    description: string;
  };
  submitter: {
    id: string;
    name: string;
    email: string;
  };
  questionResponses: Array<{
    id: string;
    questionId: string;
    value: string;
    question: {
      id: string;
      questionText: string;
      questionType: string;
    };
  }>;
}


