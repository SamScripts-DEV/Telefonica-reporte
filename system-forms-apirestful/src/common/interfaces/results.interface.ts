export interface BulkSuccess {
  formId: string;
  technicianId: string;
  responseId: string;
}

export interface BulkSkipped {
  formId: string;
  technicianId: string;
  reason: string;
}

export interface BulkError {
  formId: string;
  technicianId: string;
  error: string;
}

