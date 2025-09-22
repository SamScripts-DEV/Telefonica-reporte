"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "./components/Metric-card"
import { InsightBadge } from "./components/Insight-badge"
import { BarChart3, FileText, Search, Calendar, Activity, Star, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { FormsListResponseDto } from "@/types/reports-types"
import { getReportFormList } from "@/api/reports/reports-endpoints"


export default function ReportsPage({initialData}: {initialData?: FormsListResponseDto | null}) {
    const router = useRouter()
    const { user, isAuthenticated, checkAuth } = useAuth()
    const { toast } = useToast()

    const [formsData, setFormsData] = useState<FormsListResponseDto | null>(initialData || null)
    const [loading, setLoading] = useState(!initialData)
    const [searchTerm, setSearchTerm] = useState("")


    const loadFormsData = async () => {
        try {
            setLoading(true)
            const data = await getReportFormList()
            setFormsData(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los reportes.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!initialData) {
            loadFormsData()
        }
    }, [initialData])

    const filteredForms =
        formsData?.data.filter(
            (form) =>
                form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                form.description.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || []

    const getStatusBadge = (status: string) => {
        return status === "active" ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">Activo</Badge>
        ) : (
            <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactivo</Badge>
        )
    }

    const getTypeBadge = (type: string) => {
        return type === "periodic" ? (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
                Periódico
            </Badge>
        ) : (
            <Badge variant="outline" className="text-purple-600 border-purple-600">
                Único
            </Badge>
        )
    }

    const getPerformanceLevel = (avgSatisfaction: number | null) => {
        if (!avgSatisfaction) return "Sin datos"
        if (avgSatisfaction >= 4.5) return "Excelente"
        if (avgSatisfaction >= 4.0) return "Bueno"
        if (avgSatisfaction >= 3.5) return "Regular"
        return "Necesita mejora"
    }

    const getPerformanceColor = (avgSatisfaction: number | null) => {
        if (!avgSatisfaction) return "text-gray-600"
        if (avgSatisfaction >= 4.5) return "text-green-600"
        if (avgSatisfaction >= 4.0) return "text-blue-600"
        if (avgSatisfaction >= 3.5) return "text-yellow-600"
        return "text-red-600"
    }



    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Reportes y Analytics</h1>
                    <p className="text-gray-600">Sistema avanzado de análisis y reportes para evaluación de técnicos</p>
                </div>

                {/* Summary Cards */}
                {formsData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            title="Total Formularios"
                            value={formsData.summary.totalForms}
                            subtitle="Formularios creados"
                            icon={FileText}
                            variant="default"
                        />
                        <MetricCard
                            title="Formularios Activos"
                            value={formsData.summary.formsWithActivity}
                            subtitle="Con actividad reciente"
                            icon={Activity}
                            variant="success"
                        />
                        <MetricCard
                            title="Satisfacción Promedio"
                            value={formsData.summary.avgSatisfactionAcrossAllForms.toFixed(1)}
                            subtitle="Calificación general"
                            icon={Star}
                            trend="up"
                            trendValue="+0.2"
                            variant="default"
                        />
                        <MetricCard
                            title="Formularios Periódicos"
                            value={formsData.summary.periodicForms}
                            subtitle={`${formsData.summary.singleForms} únicos`}
                            icon={Calendar}
                            variant="default"
                        />
                    </div>
                )}

                {/* Forms List */}
                <Card className="shadow-lg border-gray-200 bg-white">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-gray-900 flex items-center">
                                    <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                                    Formularios de Evaluación
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                    Selecciona un formulario para ver reportes detallados y analytics
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search */}
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar formularios..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Forms Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredForms.map((form) => (
                                <Card
                                    key={form.formId}
                                    className="border-gray-200 hover:border-blue-300 cursor-pointer transition-colors group"
                                    onClick={() => router.push(`/reports/${form.formId}`)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <CardTitle className="text-lg text-gray-900 group-hover:text-blue-700 transition-colors">
                                                {form.title}
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                {getStatusBadge(form.status)}
                                                {getTypeBadge(form.type)}
                                            </div>
                                        </div>
                                        <CardDescription className="text-gray-600 line-clamp-2">{form.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{form.totalResponses}</div>
                                                <div className="text-xs text-gray-500">Respuestas</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{form.uniqueEvaluatedTechnicians}</div>
                                                <div className="text-xs text-gray-500">Técnicos</div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Satisfacción:</span>
                                                <span className={`text-sm font-medium ${getPerformanceColor(form.avgSatisfaction)}`}>
                                                    {form.avgSatisfaction ? `${form.avgSatisfaction.toFixed(1)}/5.0` : "Sin datos"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Nivel:</span>
                                                <span className={`text-sm font-medium ${getPerformanceColor(form.avgSatisfaction)}`}>
                                                    {getPerformanceLevel(form.avgSatisfaction)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Última actividad:</span>
                                                <span className="text-sm text-gray-500">
                                                    {form.lastActivity ? `Hace ${form.daysWithoutActivity} días` : "Sin actividad"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Insights */}
                                        <div className="space-y-2 mb-4">
                                            {form.avgSatisfaction && form.avgSatisfaction >= 4.5 && (
                                                <InsightBadge type="strength" priority="low" message="Excelente nivel de satisfacción" />
                                            )}
                                            {form.daysWithoutActivity && form.daysWithoutActivity > 14 && (
                                                <InsightBadge
                                                    type="alert"
                                                    priority="high"
                                                    message={`Sin actividad por ${form.daysWithoutActivity} días`}
                                                />
                                            )}
                                            {form.totalResponses > 1000 && (
                                                <InsightBadge type="opportunity" priority="medium" message="Alto volumen de datos disponible" />
                                            )}
                                        </div>

                                        <Button
                                            className="w-full bg-blue-700 hover:bg-blue-800 text-white group-hover:bg-blue-800"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/reports/${form.formId}`)
                                            }}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Ver Reportes Detallados
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {filteredForms.length === 0 && (
                            <div className="text-center py-12">
                                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg font-medium mb-2">
                                    {searchTerm ? "No se encontraron formularios" : "No hay formularios disponibles"}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {searchTerm
                                        ? "Intenta ajustar los términos de búsqueda."
                                        : "Crea tu primer formulario para comenzar a generar reportes."}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
