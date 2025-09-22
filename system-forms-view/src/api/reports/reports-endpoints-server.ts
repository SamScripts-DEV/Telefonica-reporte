import axios from "axios";
import { cookies } from "next/headers";
import { api_endpoints } from "@/constants/api-endpoints";


export const serverAxios = axios.create({
    baseURL: process.env.API_BASE_URL,
    timeout: 10000,
})


export async function getReportFormListServer() {
  try {
    const cookieStore = cookies();
    const cookieHeader = cookieStore.toString();

    const res = await serverAxios.get(api_endpoints.reports.getFormList, {
      headers: { Cookie: cookieHeader },
      withCredentials: true,
    });

    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) return null;
    console.error("Server: Error fetching report form list:", err);
    return null;
  }
}


export async function getReportFormDashboardServer(id: string) {
    try {
        const cookieStore = cookies();
        const cookieHeader = cookieStore.toString();

        const res = await serverAxios.get(api_endpoints.reports.getFormDashboard(id), {
            headers: { Cookie: cookieHeader },
            withCredentials: true,
        });

        return res.data;
    } catch (err: any) {
        if (err.response?.status === 401) return null;
        console.error("Server: Error fetching report form dashboard:", err);
        return null;
        
    }
}

export async function getEvaluatorAnalysisServer(id: string, evaluatorId: string) {
    try {

        const cookieStore = cookies();
        const cookieHeader = cookieStore.toString();

        const res = await serverAxios.get(api_endpoints.reports.getEvaluatorAnalysis(id, evaluatorId), {
            headers: { Cookie: cookieHeader },
            withCredentials: true,
        });
        return res.data;
        
    } catch (err: any) {
        if (err.response?.status === 401) return null;
        console.error("Server: Error fetching evaluator analysis:", err);
        return null;
        
    }
}

export async function getTechnicianAnalysisServer(id: string, technicianId: string) {
    try {
        const cookieStore = cookies();
        const cookieHeader = cookieStore.toString();

        const res = await serverAxios.get(api_endpoints.reports.getTechnicianAnalysis(id, technicianId), {
            headers: { Cookie: cookieHeader },
            withCredentials: true,
        });
        return res.data;

    } catch (err: any) {
        if (err.response?.status === 401) return null;
        console.error("Server: Error fetching technician analysis:", err);
        return null;

    }
}


export async function getTowerAnalysisServer(id: string, towerId: string) {
    try {
        const cookieStore = cookies();
        const cookieHeader = cookieStore.toString();    
        const res = await serverAxios.get(api_endpoints.reports.getTowerAnalysis(id, towerId), {
            headers: { Cookie: cookieHeader },
            withCredentials: true,
        });
        return res.data;    
    } catch (err: any) {
        if (err.response?.status === 401) return null;
        console.error("Server: Error fetching towers comparison:", err);
        return null;    
    }
}

export async function getTowersComparisonServer(id: string) {
    try {
        const cookieStore = cookies();  
        const cookieHeader = cookieStore.toString();
        const res = await serverAxios.get(api_endpoints.reports.getTowersComparison(id), {
            headers: { Cookie: cookieHeader },
            withCredentials: true,
        });
        return res.data;
    } catch (err: any) {
        if (err.response?.status === 401) return null;
        console.error("Server: Error fetching towers comparison:", err);
        return null;    
    }   
}
