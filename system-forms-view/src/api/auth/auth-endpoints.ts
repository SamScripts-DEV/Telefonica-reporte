import { api_endpoints } from "@/constants/api-endpoints";
import api from "../utils";
import { LoginDto, User } from "@/types/auth-types";

export const login = async (data: LoginDto) => {
    try {
        const response = await api.post(api_endpoints.auth.login, data, { withCredentials: true });
        return response.data
    } catch (error) {
        console.error('Login error: ', error);
        throw error;
    }
}

export const checkAuthEndpoint = async () => {
    try {
        // ✅ Usar axios con el patrón establecido
        const response = await api.get(api_endpoints.auth.checkAuth, { 
            withCredentials: true 
        });
        
        return {
            success: true,
            user: response.data.user
        }
    } catch (error) {
        console.error('Auth check error: ', error);
        return {
            success: false,
            user: null
        }
    }
}

export const logout = async () => {
    try {
        await api.post(api_endpoints.auth.logOut, {}, { withCredentials: true })
        return { success: true }
    } catch (error) {
        console.error('Logout error: ', error)
        return { success: false }
    }
}