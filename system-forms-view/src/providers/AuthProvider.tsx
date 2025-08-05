"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { login as loginEndpoint, checkAuthEndpoint, logout as logoutEndpoint } from '@/api/auth/auth-endpoints'
import { User } from '@/types/auth-types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void> // <-- Cambia la firma
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      const response = await checkAuthEndpoint()
      
      if (response.success && response.user) {
        setUser(response.user)
        setIsAuthenticated(true)
      } else {
        throw new Error('Sesión inválida')
      }
    } catch (error) {
      console.log('Auth check failed:', error)
      setUser(null)
      setIsAuthenticated(false)
      
      // Solo redirigir si no estamos en una ruta pública
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.push('/auth/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await loginEndpoint({ email, password })
      setUser({
        ...response.user, // debe incluir towers
      })
      setIsAuthenticated(true)
      return response // <-- retorna la respuesta
    } catch (error) {
      setUser(null)
      setIsAuthenticated(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutEndpoint() // Llama al endpoint del backend
    } catch (error) {
      // Puedes mostrar un mensaje o ignorar el error
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      router.push('/auth/login')
    }
  }

  // Verificar auth al montar el componente
  useEffect(() => {
    checkAuth()
  }, [])

  // Verificar auth cada vez que cambie la ruta
  useEffect(() => {
    if (!isLoading && !PUBLIC_ROUTES.includes(pathname)) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      }
    }
  }, [pathname, isAuthenticated, isLoading])

  // Verificar auth periódicamente (opcional)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        checkAuth()
      }, 5 * 60 * 1000) // Cada 5 minutos

      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}