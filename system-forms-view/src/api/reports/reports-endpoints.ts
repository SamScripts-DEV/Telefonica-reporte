import { EvaluatorAnalysisResponseDto, FormDashboardResponseDto, FormsListResponseDto, TechnicianAnalysisResponseDto, TowerAnalysisResponseDto, TowersComparisonResponseDto } from "@/types/reports-types";
import api from "../utils";
import { api_endpoints } from "@/constants/api-endpoints";



export async function getReportFormList(): Promise<FormsListResponseDto> {
    try {
        const response = await api.get(api_endpoints.reports.getFormList);
        return response.data;
    } catch (error) {
        console.error("Error fetching report form list:", error);
        throw new Error("Error fetching report form list");
    
    }
}

export async function getReportFormDashboard(id: string, filters?: {months: number | string}): Promise<FormDashboardResponseDto>{
    try {
        const response = await api.get(api_endpoints.reports.getFormDashboard(id), { params: filters });
        return response.data;
    } catch (error) {
        console.error("Error fetching report form dashboard:", error);
        throw new Error("Error fetching report form dashboard");
    }
}

export async function getEvaluatorAnalysis(id: string, evaluatorId: string, filters?: {months: number | string}): Promise<EvaluatorAnalysisResponseDto>{
    try {
        const response = await api.get(api_endpoints.reports.getEvaluatorAnalysis(id, evaluatorId), { params: filters });
        return response.data;
        
    } catch (error) {
        console.error("Error fetching evaluator analysis:", error);
        throw new Error("Error fetching evaluator analysis");
        
    }
}

export async function getTechnicianAnalysis(id: string, technicianId: string, filters?: {months: number | string}): Promise<TechnicianAnalysisResponseDto>{

    try {
        const response = await api.get(api_endpoints.reports.getTechnicianAnalysis(id, technicianId), { params: filters });
        return response.data;

    } catch (error) {
        console.error("Error fetching technician analysis:", error);
        throw new Error("Error fetching technician analysis");

    }
}

export async function getTowerAnalysis(id: string, towerId: string, filters?: {months: number | string}): Promise<TowerAnalysisResponseDto>{
    try {
        const response = await api.get(api_endpoints.reports.getTowerAnalysis(id, towerId), { params: filters });
        return response.data;

    } catch (error) {
        console.error("Error fetching towers comparison:", error);
        throw new Error("Error fetching towers comparison");

    }
}

export async function getTowersComparison(id: string, filters: {period?: string} = {}): Promise<TowersComparisonResponseDto>{
    try {
        // ✅ Ver exactamente qué URL se construye
        const url = api_endpoints.reports.getTowersComparison(id)
        
        const response = await api.get(url, { params: filters });
        
        return response.data;
    } catch (error) {
        console.error("❌ Error fetching towers comparison:", error);
        throw new Error("Error fetching towers comparison");
    }
}