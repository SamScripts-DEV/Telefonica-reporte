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
        getFormById: (id: string) => `/forms/${id}`,
        submitForm: (id: string) => `/forms/${id}/submit`,
    }
    
}