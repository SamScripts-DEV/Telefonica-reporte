"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricCard } from "../components/Metric-card"
import { InsightBadge } from "../components/Insight-badge"
import { TrendChart } from "../components/Trend-chart"
import { AlertPanel } from "../components/Alert-panel"
import { RankingTable } from "../components/Ranking-table"
import { ArrowLeft, TrendingUp, Users, Building, Star, Activity, Eye, BarChart3, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { FormDashboardResponseDto } from "@/types/reports-types"
import { getReportFormDashboard } from "@/api/reports/reports-endpoints"
import { MonthSelector } from "@/components/ui/month-selector"


interface FormDashboardPageProps {
    params: {
        id: string
    }
    initialData?: FormDashboardResponseDto | null
}

export default function FormDashboardPage({ params, initialData }: FormDashboardPageProps) {
    const { id } = params
    const router = useRouter()
    const { user, isAuthenticated, checkAuth } = useAuth()
    const { toast } = useToast()

    const [dashboardData, setDashboardData] = useState<FormDashboardResponseDto | null>(initialData || null)
    const [loading, setLoading] = useState(!initialData)
    const [selectedMonths, setSelectedMonths] = useState("6")



    const loadDashboardData = async (months: string = selectedMonths) => {
        try {
            setLoading(true)

            const data = await getReportFormDashboard(id, { months })


            setDashboardData(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos del dashboard.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleMonthsChange = (months: string) => {
        setSelectedMonths(months)

        if (months !== "6" || !initialData) {
            loadDashboardData(months)
        }
    }

    useEffect(() => {
        if (!initialData) {
            loadDashboardData()
        }
    }, [initialData])


    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-7xl mx-auto p-6">
                    <Card className="shadow-lg border-gray-200 bg-white text-center py-12">
                        <CardContent>
                            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Formulario no encontrado</CardTitle>
                            <CardDescription className="text-gray-600 mb-6">
                                No se pudo cargar la información del formulario solicitado.
                            </CardDescription>
                            <Button
                                onClick={() => router.push("/reports")}
                                className="bg-blue-700 hover:bg-blue-800 text-white"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver a Reportes
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const getSelectedText = (value: string) => {
        switch (value) {
            case "3": return "Últimos 3 meses"
            case "6": return "Últimos 6 meses"
            case "12": return "Último año"
            default: return "Seleccionar período"
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Button variant="ghost" onClick={() => router.push("/reports")} className="mr-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{dashboardData.formInfo.title}</h1>
                            <p className="text-gray-600">Dashboard de análisis y tendencias</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <MonthSelector
                        value={selectedMonths}
                        onValueChange={handleMonthsChange}
                        disabled={loading}
                        />
                    </div>
                </div>

                {/* Alerts Panel */}
                {dashboardData.alerts.length > 0 && <AlertPanel alerts={dashboardData.alerts} className="mb-6" />}

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Respuestas Totales"
                        value={dashboardData.trends.overallTrend.reduce((sum, period) => sum + period.totalResponses, 0)}
                        subtitle="En el período seleccionado"
                        icon={Activity}
                        variant="default"
                    />
                    <MetricCard
                        title="Promedio General"
                        value={
                            dashboardData.trends.overallTrend[dashboardData.trends.overallTrend.length - 1]?.avgRating.toFixed(1) ||
                            "0"
                        }
                        subtitle="Calificación actual"
                        icon={Star}
                        trend="stable"
                        trendValue="0.0%"
                        variant="default"
                    />
                    <MetricCard
                        title="Torres Evaluadas"
                        value={dashboardData.towers.length}
                        subtitle={`${dashboardData.towers.filter((t) => t.isAboveAverage).length} sobre promedio`}
                        icon={Building}
                        variant="success"
                    />
                    <MetricCard
                        title="Evaluadores Activos"
                        value={dashboardData.evaluators.length}
                        subtitle={`${dashboardData.evaluators.filter((e) => e.status === "compliant").length} al día`}
                        icon={Users}
                        variant="default"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Overall Trend Chart */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                                Tendencia General
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Evolución del promedio de calificaciones por período
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TrendChart
                                data={dashboardData.trends.overallTrend.map((item) => ({
                                    period: item.period,
                                    value: item.avgRating,
                                    responses: item.totalResponses,
                                }))}
                                height={300}
                            />
                        </CardContent>
                    </Card>

                    {/* Question Trends */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
                                Tendencias por Pregunta
                            </CardTitle>
                            <CardDescription className="text-gray-600">Performance de preguntas individuales</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {dashboardData.trends.questionTrends.map((question) => (
                                    <div key={question.questionId} className="border-b border-gray-100 pb-4 last:border-b-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-gray-900 text-sm">{question.questionText}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-gray-900">{question.currentAvg.toFixed(1)}</span>
                                                <InsightBadge
                                                    type={
                                                        question.trend === "improving"
                                                            ? "strength"
                                                            : question.trend === "declining"
                                                                ? "alert"
                                                                : "opportunity"
                                                    }
                                                    priority={Math.abs(question.changePercentage) > 10 ? "high" : "medium"}
                                                    message={`${question.changePercentage > 0 ? "+" : ""}${question.changePercentage.toFixed(1)}%`}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {question.totalResponses} respuestas • Posición {question.position}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tables Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Towers Ranking */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-gray-900 flex items-center">
                                        <Building className="mr-2 h-5 w-5 text-purple-600" />
                                        Ranking de Torres
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Performance por torre ordenado por calificación
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/reports/${id}/towers-comparison`)}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Comparación
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <RankingTable
                                data={dashboardData.towers.map((tower, index) => ({
                                    rank: index + 1,
                                    name: tower.towerName,
                                    score: tower.avgRating,
                                    subtitle: `${tower.evaluatedTechnicians}/${tower.totalTechnicians} técnicos`,
                                    badge: tower.isAboveAverage ? "success" : "warning",
                                    badgeText: `${tower.coveragePercentage}% cobertura`,
                                    onClick: () => router.push(`/reports/${id}/towers/${tower.towerId}`),
                                }))}
                            />
                        </CardContent>
                    </Card>

                    {/* Evaluators Status */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <Users className="mr-2 h-5 w-5 text-orange-600" />
                                Estado de Evaluadores
                            </CardTitle>
                            <CardDescription className="text-gray-600">Cobertura y actividad de evaluadores</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RankingTable
                                data={dashboardData.evaluators.map((evaluator, index) => ({
                                    rank: index + 1,
                                    name: evaluator.evaluatorName,
                                    score: evaluator.coveragePercentage,
                                    subtitle: `${evaluator.evaluationsCompleted} evaluaciones`,
                                    badge: evaluator.status === "compliant" ? "success" : "warning",
                                    badgeText: evaluator.status === "compliant" ? "Al día" : "Pendiente",
                                    onClick: () => router.push(`/reports/${id}/evaluators/${evaluator.evaluatorId}`),
                                }))}
                                scoreLabel="Cobertura"
                                scoreUnit="%"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
