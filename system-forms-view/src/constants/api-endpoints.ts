import { get } from "http";

export const api_endpoints = {
    auth: {
        login: '/auth/login'
    },
    forms: {
        createForm: '/forms/create',
        getForms: '/forms', //Primera pagina con 10 elementos
        
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
        updateUser: '/users/update',
        deleteUser: '/users/delete',
        technicians: {
            createTechnician: '/technicians',
            getTechnicians: '/technicians',

        }
    },
    formsforClient:{
        getFormsForClient: '/forms/pending',
        getFormById: (id: string) => `/forms/${id}`,
        submitForm: (id: string) => `/forms/${id}/submit`,
    }
    
}