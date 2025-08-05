import { FormCreateRequest } from "@/types/forms-types"
import api from "../utils"
import { api_endpoints } from "@/constants/api-endpoints"


export const formsApi = {
    createForm: async (formData: FormCreateRequest) => {
        try {
            const response = await api.post(api_endpoints.forms.createForm, formData)
            return response.data
        } catch (error) {
            console.error("Error creating form:", error)
            throw error
        }
    },
    
    getForms: async () => {
        const response = await api.get(api_endpoints.forms.getForms)
        return response.data.data.map((form: any) => ({
            ...form,
            // Para compatibilidad
            targetTowers: (form.towers || []).map((tower: {name: string}) => tower.name)
        }))
    },


    getFormById: async (id: string) => {
        const res = await api.get(api_endpoints.formsforClient.getFormById(id));
        return res.data;
    },

    updateForm: async (id: string, updates: Partial<FormCreateRequest>) => {
        try {
            const response = await api.patch(api_endpoints.forms.updatedForm(id), updates)
            return response.data
        } catch (error) {
            console.error("Error updating form:", error)
            throw error
        }
    },

    
    submitForm: async (formId: string, answers: Array<{questionId: string, value: string | number}>, technicianId?: string) => {
        const payload = {
            answers,
            ...(technicianId && { technicianId }) // Solo incluir si existe
        };
        
        console.log('🌐 API: Enviando a backend:', {
            url: api_endpoints.formsforClient.submitForm(formId),
            payload
        });
        
        const response = await api.post(api_endpoints.formsforClient.submitForm(formId), payload);
        return response.data;
    }
}