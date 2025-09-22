import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Users, BarChart3, Plus } from "lucide-react"
import Link from "next/link"
import { getTowerColor } from "@/constants/colors"

import { FormData } from "@/stores/form-store"
import { Tower } from "@/types/towers-types";

interface AdminDashboardProps {
    forms: FormData[];
    towers: Tower[];
    isLoading: boolean;
}

export default function AdminDashboard({forms, towers, isLoading}: AdminDashboardProps) {
    return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Gestiona tus formularios y evaluaciones</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-blue-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Formularios</CardTitle>
              <FileText className="h-4 w-4 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forms.length}</div>
              <p className="text-xs text-blue-200">{forms.filter((f) => f.isActive).length} activos</p>
            </CardContent>
          </Card>

          {/* <Card className="border-0 shadow-lg bg-green-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Respuestas</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forms.filter((f) => f.totalResponses).length}</div>
              <p className="text-xs text-green-200">Este mes</p>
            </CardContent>
          </Card> */}

          <Card className="border-0 shadow-lg bg-orange-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Torres Activas</CardTitle>
              <Users className="h-4 w-4 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{towers.length}</div>
              <p className="text-xs text-orange-200">
                {towers.length > 0
                  ? towers.slice(0, 6).map((tower: { name: string }) => tower.name).join(", ")
                  : "Sin torres configuradas"
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Formularios Recientes</CardTitle>
              <CardDescription className="text-gray-600">Gestiona tus formularios existentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="animate-pulse flex flex-col space-y-4">
                    <div className="h-12 bg-gray-200 rounded-md"></div>
                    <div className="h-12 bg-gray-200 rounded-md"></div>
                    <div className="h-12 bg-gray-200 rounded-md"></div>
                  </div>
                ) : forms.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay formularios recientes</h3>
                    <p className="text-gray-600">No has creado ningún formulario aún.</p>
                    <Link href="/forms/create">
                      <Button className="mt-4 bg-blue-700 hover:bg-blue-800 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Nuevo Formulario
                      </Button>
                    </Link>
                  </div>
                ) : (
                  forms.slice(0, 3).map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{form.title}</h4>
                        <p className="text-sm text-gray-600">
                          {(form.questions || []).length} preguntas
                          {form.towers && form.towers.length > 0 && (
                            <span className="ml-2">
                              {form.towers.map((tower) => {
                                // ✅ Buscar el índice real de la torre en el array completo
                                const realTowerIndex = towers.findIndex(t => t.id === tower.id);
                                const towerIndex = realTowerIndex !== -1 ? realTowerIndex : 0;

                                return (
                                  <span key={tower.id} className="inline-flex items-center ml-1">
                                    <span
                                      className="inline-block w-2 h-2 rounded-full"
                                      style={{ backgroundColor: getTowerColor(towerIndex) }}
                                    ></span>
                                    <span className="ml-1 text-xs">{tower.name}</span>
                                  </span>
                                );
                              })}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/forms/${form.id}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent hover:bg-gray-100 border-gray-300 text-gray-700"
                          >
                            Editar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
                <Link href="/forms">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent hover:bg-gray-100 border-gray-300 text-gray-700"
                  >
                    Ver Todos los Formularios
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Acciones Rápidas</CardTitle>
              <CardDescription className="text-gray-600">Crea y gestiona contenido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/forms/create">
                  <Button className="w-full justify-start bg-blue-700 hover:bg-blue-800 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Nuevo Formulario
                  </Button>
                </Link>
                <Link href="/reports">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent hover:bg-gray-100 border-gray-300 text-gray-700"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Ver Reportes
                  </Button>
                </Link>
                <Link href="/users">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent hover:bg-gray-100 border-gray-300 text-gray-700"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Gestionar Usuarios
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}