import { create } from "zustand"
import { persist } from "zustand/middleware"
import { login } from "@/api/auth/auth-endpoints"
import { User } from "@/types/auth-types"



interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean // Agregar esta línea
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => boolean // Cambiar el tipo de retorno
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false, // Agregar esta línea

      login: async (email: string, password: string) => {
        set({ isLoading: true })

        try {
          // Simulación de API call - aquí conectarías con tu backend
          const response = await login({ email, password })
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          })
        } catch (error) {
          set({ isLoading: false, isInitialized: true })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
        })
      },

      checkAuth: () => {
        const { user } = get()
        const isAuth = !!user
        set({
          isAuthenticated: isAuth,
          isInitialized: true,
        })
        return isAuth
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // NO incluir isLoading ni isInitialized
      }),
    },
  ),
)
