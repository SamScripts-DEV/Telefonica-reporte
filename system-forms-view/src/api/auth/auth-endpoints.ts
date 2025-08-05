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