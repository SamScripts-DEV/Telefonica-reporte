import { get } from "http";
import { LogOut } from "lucide-react";
import { checkCustomRoutes } from "next/dist/lib/load-custom-routes";

export const api_endpoints = {
    auth: {
        login: '/auth/login',
        checkAuth: '/auth/check',
        logOut: '/auth/logout',
    },
    forms: {
        createForm: '/forms/create',
        getForms: '/forms',
        getFormById: (id: string) => `/forms/${id}`,
        updatedForm: (id: string) => `/forms/${id}`, // <-- PATCH
        getEvaluationMatrix: (id: number) => `/forms/evaluation-matrix/${id}`,
        
    },
    towers: {
        getTowers: '/towers'
    },
    questions: {
        createQuestion: '/questions',
        getQuestions: '/questions'
    },
    users: {
        getUsers: '/users',
        createUser: '/users',
        updateUser: (id: string) => `/users/${id}`,
        deleteUser: (id: string) => `/users/${id}`,
        technicians: {
            createTechnician: '/technicians',
            getTechnicians: '/technicians',
            updateTechnician: (id: string) => `/technicians/${id}`,

        }
    },
    formsforClient:{
        getFormById: (id: string) => `/forms/${id}`,
        submitForm: (id: string) => `/forms/${id}/submit`,


        submitBulkEvaluations: 'forms/bulk-submit'
    },

    reports: {
        getFormList: '/reports/forms',
        getFormDashboard: (formId: string) => `/reports/forms/${formId}/dashboard`,
        getTowerAnalysis: (formId: string, towerId: string) => `/reports/forms/${formId}/towers/${towerId}`,
        getTechnicianAnalysis: (formId: string, technicianId: string) => `/reports/forms/${formId}/technicians/${technicianId}`,
        getEvaluatorAnalysis: (formId: string, evaluatorId: string) => `/reports/forms/${formId}/evaluators/${evaluatorId}`,
        getTowersComparison: (formId: string) => `/reports/forms/${formId}/towers-comparison`,
    }
    
}