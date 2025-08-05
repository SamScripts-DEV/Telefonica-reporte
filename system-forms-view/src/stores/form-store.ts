import { create } from "zustand";
import { formsApi } from "@/api/forms/forms-endpoints";
import { Tower } from "@/types/towers-types";

export interface FormQuestion {
  id: string;
  text: string;
  type: "rating" | "text" | "number";
  required: boolean;
  options?: {
    maxStars?: number;
    placeholder?: string;
    min?: number;
    max?: number;
    starDescriptions?: string[];
  };
}

export interface FormData {
  id: string;
  title: string;
  description: string;
  questions: FormQuestion[];
  targetTowers: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  towers?: Tower[];
}

export interface FormResponse {
  id: string;
  formId: string;
  userId: string;
  technicianId: string;
  responses: Record<string, any>;
  submittedAt: string;
}

interface FormState {
  forms: FormData[];
  pendingForms: FormData[];
  responses: FormResponse[];
  currentForm: any; // ✅ AGREGAR: Para almacenar el formulario actual
  isLoading: boolean;
  error: string | null;

  // API operations
  getForms: () => Promise<void>;
  getPendingForms: () => Promise<void>;
  getFormById: (id: string) => Promise<void>; // ✅ AGREGAR: Cambiar a void, guarda en store
  createForm: (formData: any) => Promise<FormData>;
  updateForm: (id: string, updates: Partial<FormData>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;

  // Local state operations
  setForms: (forms: FormData[]) => void;
  setCurrentForm: (form: any) => void; // ✅ AGREGAR
  addForm: (form: FormData) => void;
  removeForm: (id: string) => void;
  setLoading: (loading: boolean) => void;

  // Response operations
  addResponse: (response: FormResponse) => void;
  getResponsesByForm: (formId: string) => FormResponse[];

  // ✅ CAMBIO: Actualizar método submit
  submitForm: (formId: string, answers: Array<{questionId: string, value: string | number}>, technicianId?: string) => Promise<any>;
}

export const useFormStore = create<FormState>((set, get) => ({
  forms: [],
  pendingForms: [],
  responses: [],
  currentForm: null, // ✅ AGREGAR
  isLoading: false,
  error: null,

  getForms: async () => {
    try {
      set({ isLoading: true, error: null });
      const forms = await formsApi.getForms();
      set({ forms, isLoading: false });
    } catch (error: any) {
      console.error("Error fetching forms:", error);
      set({ error: "Error al cargar formularios", isLoading: false });
    }
  },

  getPendingForms: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await formsApi.getFormsForClient();
      set({ pendingForms: response.data, isLoading: false });
    } catch (error: any) {
      console.error("Error fetching pending forms:", error);
      set({ error: "Error al cargar formularios pendientes", isLoading: false });
    }
  },

  // ✅ AGREGAR: Cargar formulario específico y guardarlo en el store
  getFormById: async (id: string) => {
    try {
      console.log('🔍 Store: Cargando formulario ID:', id);
      set({ isLoading: true, error: null, currentForm: null });
      
      const form = await formsApi.getFormById(id);
      console.log('✅ Store: Formulario cargado:', form);
      
      set({ currentForm: form, isLoading: false });
    } catch (error: any) {
      console.error("❌ Store: Error fetching form:", error);
      set({ error: "Error al cargar formulario", isLoading: false, currentForm: null });
    }
  },

  createForm: async (formData) => {
    try {
      set({ isLoading: true, error: null });
      const newForm = await formsApi.createForm(formData);
      set((state) => ({
        forms: [...state.forms, newForm],
        isLoading: false,
      }));
      return newForm;
    } catch (error: any) {
      console.error("Error creating form:", error);
      set({ error: "Error al crear formulario", isLoading: false });
      throw error;
    }
  },

  updateForm: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      set((state) => ({
        forms: state.forms.map((form) =>
          form.id === id ? { ...form, ...updates } : form
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("Error updating form:", error);
      set({ error: "Error al actualizar formulario", isLoading: false });
    }
  },

  deleteForm: async (id) => {
    try {
      set({ isLoading: true, error: null });
      set((state) => ({
        forms: state.forms.filter((form) => form.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      console.error("Error deleting form:", error);
      set({ error: "Error al eliminar formulario", isLoading: false });
    }
  },

  // ✅ AGREGAR
  setCurrentForm: (form) => set({ currentForm: form }),
  setForms: (forms) => set({ forms }),
  addForm: (form) => set((state) => ({ forms: [...state.forms, form] })),
  removeForm: (id) => set((state) => ({ forms: state.forms.filter((form) => form.id !== id) })),
  setLoading: (loading) => set({ isLoading: loading }),
  addResponse: (response) => set((state) => ({ responses: [...state.responses, response] })),
  getResponsesByForm: (formId) => get().responses.filter((response) => response.formId === formId),

  // ✅ CAMBIO: Actualizar implementación submit
  submitForm: async (formId: string, answers: Array<{questionId: string, value: string | number}>, technicianId?: string) => {
    try {
      console.log('🚀 Store: Enviando formulario:', { formId, answers, technicianId });
      set({ isLoading: true, error: null });
      
      const response = await formsApi.submitForm(formId, answers, technicianId);
      console.log('✅ Store: Respuesta recibida:', response);
      
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      console.error("❌ Store: Error submitting form:", error);
      set({ error: "Error al enviar formulario", isLoading: false });
      throw error;
    }
  },
}));
