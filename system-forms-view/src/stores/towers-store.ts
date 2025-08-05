import { create } from "zustand";
import { Tower } from "@/types/towers-types";
import { towersApi } from "@/api/towers/towers-endpoints";

interface TowersState {
  towers: Tower[];
  isLoading: boolean;
  error: string | null;
  fetchTowers: () => Promise<void>;
}

export const useTowersStore = create<TowersState>((set) => ({
  towers: [],
  isLoading: false,
  error: null,
  fetchTowers: async () => {
    set({ isLoading: true, error: null });
    try {
      const towers = await towersApi.getTowers();
      console.log("Fetched towers:", towers);
      
      set({ towers, isLoading: false });
    } catch (error) {
      set({ error: "Error al cargar torres", isLoading: false });
    }
  },
}));