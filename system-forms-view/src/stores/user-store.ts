import { create } from "zustand"
import { usersApi } from "@/api/users/users-endpoints"


export interface UserRole {
  id: number
  name: string
  description?: string
}

export interface UserTower {
  id: number
  name: string
}

export interface UserGroup {
  id: number
  name: string
}

export interface AssignedTechnician {
  id: string
  name: string
  position: string
  towerId: number
}

export interface User {
  id: string
  name: string
  email: string
  isActive: boolean
  roleId: number
  createdAt: string
  role: UserRole
  towers: UserTower[]
  groups: UserGroup[]
  assignedTechnicians: AssignedTechnician[]
}

export interface Technician {
  id: string
  name: string
  towerId: number
  tower: {
    id: number
    name: string
  }
  position?: string // Si no viene, puedes dejarlo opcional
  isActive?: boolean // Si no viene, puedes dejarlo opcional
}

interface UserState {
  users: User[]
  technicians: Technician[]
  isLoading: boolean
  error: string | null
  createUser: (data: any) => Promise<any>
  createTechnician: (data: any) => Promise<any>
  getUsers: () => Promise<void>
  getTechnicians: () => Promise<void>
  updateUser: (id: string, updatedData: Partial<User>) => Promise<any>
  updateTechnician: (id: string, updatedData: Partial<Technician>) => Promise<any>
  deleteUser: (id: string) => Promise<any>
  deleteTechnician: (id: string) => Promise<any>
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  technicians: [],
  isLoading: false,
  error: null,
  createUser: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const user = await usersApi.createUser(data)
      set({ isLoading: false })
      return user
    } catch (error: any) {
      set({ error: error.message || "Error al crear usuario", isLoading: false })
      throw error
    }
  },
  createTechnician: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const technician = await usersApi.createTechnician(data)
      set({ isLoading: false })
      return technician
    } catch (error: any) {
      set({ error: error.message || "Error al crear técnico", isLoading: false })
      throw error
    }
  },
  getUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await usersApi.getUsers()
      set({ users: response.data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message || "Error al obtener usuarios", isLoading: false })
    }
  },
  getTechnicians: async () => {
    set({ isLoading: true })
    try {
      const response = await usersApi.getTechnicians()
      set({ technicians: response.data, isLoading: false }) // Solo el array data
    } catch (error: any) {
      set({ error: error.message || "Error al obtener técnicos", isLoading: false })
    }
  },

  updateUser: async (id, updatedData) => {
    set({ isLoading: true, error: null })
    try {
      const user = await usersApi.updateUser(id, updatedData)
      // Actualiza el usuario en el estado local
      set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...user } : u),
        isLoading: false
      }))
      return user
    } catch (error: any) {
      set({ error: error.message || "Error al actualizar usuario", isLoading: false })
      throw error
    }
  },

  updateTechnician: async (id, updatedData) => {
    set({ isLoading: true, error: null })
    try {
      const technician = await usersApi.updateTechnician(id, updatedData)
      set((state) => ({
        technicians: state.technicians.map(t => t.id === id ? { ...t, ...technician } : t),
        isLoading: false
      }))
      return technician
    } catch (error: any) {
      set({ error: error.message || "Error al actualizar técnico", isLoading: false })
      throw error
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null })
    try {
      // Soft delete: solo cambia el estado isActive a false
      const user = await usersApi.deleteUser(id)
      set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...user } : u),
        isLoading: false
      }))
      return user
    } catch (error: any) {
      set({ error: error.message || "Error al desactivar usuario", isLoading: false })
      throw error
    }
  },

  deleteTechnician: async (id) => {
    set({ isLoading: true, error: null })
    try {
      // Soft delete: solo cambia el estado isActive a false
      const technician = await usersApi.deleteTechnician(id)
      set((state) => ({
        technicians: state.technicians.map(t => t.id === id ? { ...t, ...technician } : t),
        isLoading: false
      }))
      return technician
    } catch (error: any) {
      set({ error: error.message || "Error al desactivar técnico", isLoading: false })
      throw error
    }
  }
}))