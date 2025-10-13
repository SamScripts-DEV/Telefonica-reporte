import { BulkEvaluationRequest, FormCreateRequest } from "@/types/forms-types"
import api from "../utils"
import { api_endpoints } from "@/constants/api-endpoints"


export const formsApi = {
    createForm: async (formData: FormCreateRequest) => {
        try {
            const response = await api.post(api_endpoints.forms.createForm, formData, { withCredentials: true })
            return response.data
        } catch (error) {
            console.error("Error creating form:", error)
            throw error
        }
    },

    getForms: async () => {
        const response = await api.get(api_endpoints.forms.getForms, { withCredentials: true })
        return response.data.data.map((form: any) => ({
            ...form,
            // Para compatibilidad
            targetTowers: (form.towers || []).map((tower: { name: string }) => tower.name)
        }))
    },

    getFormById: async (id: string) => {
        const res = await api.get(api_endpoints.formsforClient.getFormById(id), { withCredentials: true });
        return res.data;
    },

    updateForm: async (id: string, updates: Partial<FormCreateRequest>) => {
        try {
            const response = await api.patch(api_endpoints.forms.updatedForm(id), updates, { withCredentials: true })
            return response.data
        } catch (error) {
            console.error("Error updating form:", error)
            throw error
        }
    },


    submitForm: async (formId: string, answers: Array<{ questionId: string, value: string | number }>, technicianId?: string) => {
        try {
            const payload = {
                answers,
                ...(technicianId && { technicianId })
            };
            const response = await api.post(api_endpoints.formsforClient.submitForm(formId), payload);
            return response.data;

        } catch (error) {
            console.error("Error submitting form:", error)
            throw error

        }
    },



    //New Endpoints
    getEvaluationsMatrixByTower: async (towerId: number) => {
        try {
            const response = await api.get(api_endpoints.forms.getEvaluationMatrix(towerId), { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error fetching evaluation matrix:", error);
            throw error;
        }
    },
    submitBulkEvaluations: async (data: BulkEvaluationRequest) => {
        try {
            const response = await api.post(api_endpoints.formsforClient.submitBulkEvaluations, data, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error submitting bulk evaluations:", error);
            throw error;
        }
    },
    changeFormStatus: async (id: string, status: string) => {
        try {
            const response = await api.patch(api_endpoints.forms.changeStatusForm(id), { status }, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Error changing form status:", error);
            throw error;
            
        }
    }



}