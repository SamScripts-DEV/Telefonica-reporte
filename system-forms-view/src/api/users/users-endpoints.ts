import api from "../utils";
import { api_endpoints } from "@/constants/api-endpoints";
import { CreateSystemUserDto, CreateTechnicianDto } from "@/types/users-types";
import { get } from "http";

export const usersApi = {
    createUser: async (userData: CreateSystemUserDto) => {
        try {
            const response = await api.post(api_endpoints.users.createUser, userData);
            return response.data;

        } catch (error) {
            console.error("Error creating user:", error);
            throw error;

        }
    },
    createTechnician: async (technicianData: CreateTechnicianDto) => {
        try {
            const response = await api.post(api_endpoints.users.technicians.createTechnician, technicianData);
            return response.data;

        } catch (error) {
            console.error("Error creating technician:", error);
            throw error;

        }
    },
    getUsers: async () => {
        try {
            const response = await api.get(api_endpoints.users.getUsers);
            return response.data;
        } catch (error) {
            console.error("Error fetching users:", error);
            throw error;
        }
    },
    getTechnicians: async () => {
        try {
            const response = await api.get(api_endpoints.users.technicians.getTechnicians);
            return response.data;
        } catch (error) {
            console.error("Error fetching technicians:", error);
            throw error;
        }
    },
    updateUser: async (id: string, updatedData: Partial<CreateSystemUserDto>) => {
        try {
            const response = await api.patch(api_endpoints.users.updateUser(id), updatedData);
            return response.data;
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },
    updateTechnician: async (id: string, updatedData: Partial<CreateTechnicianDto>) => {
        try {
            const response = await api.patch(api_endpoints.users.technicians.updateTechnician(id), updatedData);
            return response.data;
        } catch (error) {
            console.error("Error updating technician:", error);
            throw error;
        }
    },
    deleteUser: async (id: string) => {
        try {
            const response = await api.delete(api_endpoints.users.deleteUser(id));
            return response.data;
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },//soft delete
    deleteTechnician: async (id: string) => {
        try {
            const response = await api.delete(api_endpoints.users.technicians.updateTechnician(id));
            return response.data;
        } catch (error) {
            console.error("Error deleting technician:", error);
            throw error;
        }
    }//complete delete
}