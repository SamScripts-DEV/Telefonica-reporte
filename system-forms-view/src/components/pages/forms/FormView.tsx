"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { useFormStore } from "@/stores/form-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, Eye, FileText } from "lucide-react"
import Link from "next/link"
import { getTowerColor, getFormHeaderColor } from "@/constants/colors" // ✅ Importar funciones helper
import { useTowersStore } from "@/stores/towers-store"

export default function FormsView() {

  const { user, isAuthenticated, isLoading } = useAuth()
  
  const { forms, getForms, deleteForm, isLoading: formsLoading, error } = useFormStore()
  const { towers, fetchTowers } = useTowersStore()
  const router = useRouter()


  // ✅ AGREGAR ESTE useEffect:
  useEffect(() => {
    if (isAuthenticated && user) {
      getForms()
      fetchTowers()
    }
  }, [isAuthenticated, user, getForms, fetchTowers])

  // ✅ CAMBIAR LAS CONDICIONES DE LOADING:
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // ✅ AGREGAR VERIFICACIÓN DE AUTENTICACIÓN:
  if (!isAuthenticated || !user) {
    return null; // El AuthProvider se encarga de redirigir
  }

  // ✅ VERIFICAR ROL:
  if (user.role !== "superadmin") {
    router.push("/dashboard")
    return null
  }

  // ✅ CAMBIAR CONDICIÓN DE LOADING DE FORMULARIOS:
  if (formsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formularios...</p>
        </div>
      </div>
    )
  }

  // ✅ Mostrar error del store si existe
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={() => getForms()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const handleDelete = async (formId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este formulario?")) {
      try {
        await deleteForm(formId) // ✅ Usar la función del store
        alert('Formulario eliminado exitosamente')
      } catch (error) {
        console.error('Error deleting form:', error)
        alert('Error al eliminar el formulario')
      }
    }
  }

  const safeForms = Array.isArray(forms) ? forms : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header con gradiente coherente */}
        <div className="relative mb-8 p-6 rounded-2xl bg-blue-700 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
          <div className="relative">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Gestión de Formularios</h1>
                  <p className="text-blue-100 mt-1">Administra todos tus formularios de evaluación</p>
                </div>
              </div>
              <Link href="/forms/create">
                <Button className="bg-white/20 border-white/30 text-white hover:bg-white/30 border">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Formulario
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {safeForms.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white">
            <CardContent className="text-center py-12">
              <div className="p-4 bg-blue-700 rounded-full w-fit mx-auto mb-4">
                <FileText className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay formularios creados</h3>
              <p className="text-gray-600 mb-6">Comienza creando tu primer formulario de evaluación.</p>
              <Link href="/forms/create">
                <Button className="bg-blue-700 hover:bg-blue-800 shadow-lg text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primer Formulario
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeForms.map((form, index) => {
              return (
                <Card
                  key={form.id}
                  className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded bg-gray-100">
                            <FileText className="h-4 w-4 text-gray-600" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">{form.title}</CardTitle>
                        </div>
                        <CardDescription className="mt-1 text-gray-600">
                          <div className="whitespace-pre-line max-h-20 overflow-y-auto text-sm leading-relaxed">
                            {form.description}
                          </div>
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/forms/${form.id}`}>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/forms/${form.id}/edit`}>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => handleDelete(form.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Preguntas:</span>
                        <Badge 
                          style={{ backgroundColor: getFormHeaderColor(index) }}
                          className="text-white border-0"
                        >
                          {(form.questions || []).length}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Estado del formulario:</span>
                        <Badge
                          className={
                            form.status === "active" 
                              ? "bg-green-100 text-green-800 border border-green-200" 
                              : form.status === "draft"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : form.status === "closed"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }
                        >
                          {form.status === "active" && "Activo para responder"}
                          {form.status === "draft" && "En borrador"}
                          {form.status === "closed" && "Cerrado"}
                          {!["active", "draft", "closed"].includes(form.status) && form.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Visibilidad:</span>
                        <Badge
                          className={
                            form.isActive 
                              ? "bg-blue-50 text-blue-700 border border-blue-200" 
                              : "bg-red-50 text-red-700 border border-red-200"
                          }
                        >
                          {form.isActive ? "Visible" : "Eliminado"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Modalidad:</span>
                        <Badge className="bg-gray-50 text-gray-700 border border-gray-200">
                          {form.type === "periodic" 
                            ? `Periódico (día ${form.startDay} al ${form.endDay})`
                            : "Una sola vez"
                          }
                        </Badge>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600 mb-2 block">Torres:</span>
                        <div className="flex flex-wrap gap-1">
                          {form.towers && form.towers.length > 0 ? (
                            form.towers.map((tower, towerIndex) => (
                              <Badge
                                key={tower.id}
                                className="bg-gray-100 text-gray-700 border border-gray-200 text-xs"
                              >
                                {tower.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">Sin torres asignadas</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex gap-2">
                          <Link href={`/forms/${form.id}`} className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/forms/${form.id}/edit`} className="flex-1">
                            <Button 
                              size="sm" 
                              className="w-full"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
