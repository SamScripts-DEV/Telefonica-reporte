import api from "../utils";
import { api_endpoints } from "../../constants/api-endpoints";
import { Tower } from "@/types/towers-types";

export const towersApi = {
  getTowers: async (): Promise<Tower[]> => {
    try {
      const response = await api.get(api_endpoints.towers.getTowers);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching towers:", error);
      throw error;
    }
  }
}