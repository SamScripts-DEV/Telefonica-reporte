"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider" 
import { useFormStore } from "@/stores/form-store"
import { useTowersStore } from "@/stores/towers-store" 
import { getTowerColor, getClientFormColors } from "@/constants/colors"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Users, BarChart3, Plus, Eye } from "lucide-react"
import Link from "next/link"
import ClientDashboard from "./ClientDashboard"
import AdminDashboard from "./AdminDashboard"
import { ClientDashboardMatrix } from "./Client/Client-dashboard"



export default function DashboardUnion() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { forms, getForms, isLoading: formsLoading, error, pendingForms } = useFormStore()
  const { towers, fetchTowers } = useTowersStore()

  
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Cargando formularios y torres...');
      getForms()
      fetchTowers()
    }
  }, [isAuthenticated, user, getForms, fetchTowers])

  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null; 
  }

  if (user.role === "client") {
    // return <ClientDashboard user={user} towers={towers} forms={forms} />
    return (
      <div className="min-h-screen bg-gray-100">

        <ClientDashboardMatrix user={user} towers={towers} forms={forms} />
      </div>
    )
  }

  return <AdminDashboard forms={forms} towers={towers} isLoading={isLoading} />
}

  

