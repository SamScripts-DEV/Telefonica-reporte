"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MetricCard } from "../components/Metric-card"
import { InsightBadge } from "../components/Insight-badge"
import { TrendChart } from "../components/Trend-chart"
import { RankingTable } from "../components/Ranking-table"
import { ProgressBar } from "../components/Progress-bar"
import { ArrowLeft, Building, TrendingUp, Users, Star, Activity, Award, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { TowerAnalysisResponseDto } from "@/types/reports-types"
import { getTowerAnalysis } from "@/api/reports/reports-endpoints"
import { set } from "date-fns"
import { MonthSelector } from "@/components/ui/month-selector"

interface TowerAnalysisPageProps {
  params: {
    id: string
    towerId: string
  }
  initialData?: TowerAnalysisResponseDto | null
}

export default function TowerAnalysisPage({ params, initialData }: TowerAnalysisPageProps) {
  const { id, towerId } = params
  const router = useRouter()
  const { user, isAuthenticated, checkAuth } = useAuth()
  const { toast } = useToast()

  const [towerData, setTowerData] = useState<TowerAnalysisResponseDto | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [selectedMonths, setSelectedMonths] = useState("6")


  const loadTowerData = async (months: string = selectedMonths) => {
    try {
      setLoading(true)
      const data = await getTowerAnalysis(id, towerId, {months})

      setTowerData(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la torre.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMonthsChange = (months: string) => {
    setSelectedMonths(months)
    if (months !== "6" || !initialData) {
        loadTowerData(months)
    }
  }

  useEffect(() => {
    if (!initialData) {
        loadTowerData()
    }
  }, [initialData])

  const getPerformanceLevelColor = (level: string) => {
    switch (level) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "average":
        return "text-yellow-600"
      case "needs_improvement":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getPerformanceLevelText = (level: string) => {
    switch (level) {
      case "excellent":
        return "Excelente"
      case "good":
        return "Bueno"
      case "average":
        return "Regular"
      case "needs_improvement":
        return "Necesita Mejora"
      default:
        return "Sin datos"
    }
  }


  if (!towerData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="shadow-lg border-gray-200 bg-white text-center py-12">
            <CardContent>
              <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Torre no encontrada</CardTitle>
              <CardDescription className="text-gray-600 mb-6">
                No se pudo cargar la información de la torre solicitada.
              </CardDescription>
              <Button
                onClick={() => router.push(`/reports/${id}`)}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.push(`/reports/${id}`)} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Building className="mr-3 h-8 w-8 text-blue-600" />
                {towerData.towerInfo.name}
              </h1>
              <p className="text-gray-600">Análisis detallado de performance y tendencias</p>
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

        {/* Insights */}
        {towerData.insights.length > 0 && (
          <Card className="shadow-lg border-gray-200 bg-white mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {towerData.insights.map((insight, index) => (
                  <InsightBadge key={index} type={insight.type} priority="medium" message={insight.message} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Calificación Promedio"
            value={towerData.performance.avgRating.toFixed(1)}
            subtitle={getPerformanceLevelText(towerData.performance.performanceLevel)}
            icon={Star}
            trend={
              towerData.trends.changeFromPrevious > 0
                ? "up"
                : towerData.trends.changeFromPrevious < 0
                  ? "down"
                  : "stable"
            }
            trendValue={`${towerData.trends.changeFromPrevious > 0 ? "+" : ""}${towerData.trends.changeFromPrevious.toFixed(1)}%`}
            variant={towerData.performance.performanceLevel === "excellent" ? "success" : "default"}
          />
          <MetricCard
            title="Respuestas Totales"
            value={towerData.performance.totalResponses}
            subtitle={`${towerData.performance.responsesByPeriod} este período`}
            icon={Activity}
            variant="default"
          />
          <MetricCard
            title="Cobertura de Técnicos"
            value={`${towerData.towerInfo.coveragePercentage}%`}
            subtitle={`${towerData.towerInfo.evaluatedTechnicians}/${towerData.towerInfo.totalTechnicians} evaluados`}
            icon={Users}
            variant={towerData.towerInfo.coveragePercentage >= 80 ? "success" : "warning"}
          />
          <MetricCard
            title="Mejor Período"
            value={towerData.trends.bestPeriod?.slice(-2) || "N/A"}
            subtitle="Mes con mejor performance"
            icon={Award}
            variant="success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                Tendencia de Performance
              </CardTitle>
              <CardDescription className="text-gray-600">Evolución de calificaciones por período</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={towerData.trends.periodData.map((item) => ({
                  period: item.period,
                  value: item.avgRating,
                  responses: item.responseCount,
                }))}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Question Breakdown */}
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Performance por Pregunta</CardTitle>
              <CardDescription className="text-gray-600">
                Desglose de calificaciones por área evaluada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {towerData.questionBreakdown.map((question) => (
                  <div key={question.questionId} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900 text-sm flex-1 pr-4">{question.questionText}</h4>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">{question.avgRating.toFixed(1)}</span>
                        <div className={`text-xs ${getPerformanceLevelColor(question.performanceLevel)}`}>
                          {getPerformanceLevelText(question.performanceLevel)}
                        </div>
                      </div>
                    </div>
                    <ProgressBar
                      value={question.avgRating}
                      max={5}
                      variant={
                        question.performanceLevel === "excellent"
                          ? "success"
                          : question.performanceLevel === "good"
                            ? "default"
                            : question.performanceLevel === "average"
                              ? "warning"
                              : "error"
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technicians Ranking */}
        <Card className="shadow-lg border-gray-200 bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-gray-900 flex items-center">
                  <Users className="mr-2 h-5 w-5 text-green-600" />
                  Ranking de Técnicos
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Performance individual ordenado por calificación
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RankingTable
              data={towerData.technicians.map((technician) => ({
                rank: technician.rankInTower,
                name: technician.technicianName,
                score: technician.avgRating,
                subtitle: `${technician.totalEvaluations} evaluaciones`,
                badge:
                  technician.performanceLevel === "excellent"
                    ? "success"
                    : technician.performanceLevel === "good"
                      ? "success"
                      : technician.performanceLevel === "average"
                        ? "warning"
                        : "error",
                badgeText: getPerformanceLevelText(technician.performanceLevel),
                onClick: () => router.push(`/reports/${id}/technicians/${technician.technicianId}`),
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
