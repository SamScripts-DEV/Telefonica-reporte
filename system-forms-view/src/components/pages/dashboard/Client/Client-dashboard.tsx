"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, CheckCircle, Clock, Loader2, FileText, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MatrixEvaluationForm } from "./matrix-evaluation-form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getClientFormColors } from "@/constants/colors"
import { User } from "@/types/auth-types"
import { Tower } from "@/types/towers-types"
import { FormData, useFormStore } from "@/stores/form-store"


const getInitials = (name?: string) => {
    if (!name || typeof name !== "string") return "?"
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
}

interface ClientDashboardProps {
    user: User;
    towers: Tower[];
    forms: FormData[]
}


interface Technician {
    id: string
    name: string
    towerId: number
}

interface Question {
    id: string
    questionText: string
    questionType: "text" | "select" | "radio" | "rating"
    options?: string[]
    isRequired: boolean
    section?: string // New: for grouping questions
}

interface Form {
    id: string
    title: string
    description?: string
    questions: Question[]
}

interface Evaluation {
    formId: string
    formTitle: string
    isCompleted: boolean
    completedAt: string | null
    responseId: string | null
    questions: Question[]
}

interface TechnicianEvaluation {
    technician: Technician
    evaluations: Evaluation[]
}

interface EvaluationData {
    towerId: number
    technicians: Technician[]
    forms: Form[]
    matrix: TechnicianEvaluation[]
    completedEvaluations: any[]
    stats: any
}

export function ClientDashboardMatrix({ user, towers, forms }: ClientDashboardProps) {
    const router = useRouter()
    const { isAuthenticated, checkAuth, logout } = useAuth()
    const { toast } = useToast()
    const searchParams = useSearchParams()
    const { getEvaluationMatrixByTower } = useFormStore()

    const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null)
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
    const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null)
    const [loading, setLoading] = useState(false)
    const [showMatrixForm, setShowMatrixForm] = useState(false)
    const [showSuccessToast, setShowSuccessToast] = useState(false)

    const userTowerId = user.towers?.[0]?.id;
    const userTower = towers.find(tower => Number(tower.id) === Number(userTowerId));
    const clientForms = forms.filter(form =>
        form.towers?.some(tower => Number(tower.id) === Number(userTowerId))
    );

    // useEffect(() => {
    //     if (showSuccessToast) {
    //         toast({
    //             title: "Evaluaciones enviadas",
    //             description: "Las evaluaciones se enviaron correctamente.",
    //             variant: "default",
    //         })
    //         setShowSuccessToast(false)
    //     }
    // }, [showSuccessToast, toast])


    const fetchEvaluationData = async (towerId: number) => {
        setLoading(true)
        try {
            const data = await getEvaluationMatrixByTower(towerId)
            setEvaluationData(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar las evaluaciones. Inténtalo de nuevo.",
                variant: "destructive",
            })
            console.error("Error fetching evaluation data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleTowerSelect = (towerId: string) => {
        const towerIdNum = Number.parseInt(towerId, 10)
        setSelectedTowerId(towerIdNum)
        setSelectedFormId(null)
        setShowMatrixForm(false)
        fetchEvaluationData(towerIdNum)
    }

    const handleFormSelect = (formId: string) => {
        setSelectedFormId(formId)
        setShowMatrixForm(true)
    }

    const handleBackToSelection = (showToast?: boolean) => {
        setShowMatrixForm(false)
        setSelectedFormId(null)
       
    }

    const handleBackToTowerSelection = () => {
        setShowMatrixForm(false)
        setEvaluationData(null)
        setSelectedTowerId(null)
        setSelectedFormId(null)
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    if (showMatrixForm && evaluationData && selectedFormId) {
        const selectedForm = evaluationData.forms.find((f) => f.id === selectedFormId)
        const selectedTower = towers.find(tower => Number(tower.id) === Number(selectedTowerId));


        if (selectedForm) {
            return (
                <MatrixEvaluationForm
                    evaluationData={evaluationData}
                    selectedForm={selectedForm}
                    onBack={handleBackToSelection}
                    user={user}
                    towerName={selectedTower ? selectedTower.name : 'Desconocida'}
                    onSuccess={() => setShowSuccessToast(true)}
                />
            )
        }
    }

    const selectedTower = towers.find(tower => Number(tower.id) === Number(selectedTowerId));

    return (
        <div className="max-w-7xl mx-auto p-6">

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido, {user.name}</h1>
                    <p className="text-gray-600">Selecciona una torre y encuesta para realizar las evaluaciones</p>
                </div>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            className="relative h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center shadow"
                            variant="default"
                        >
                            <Avatar className="h-9 w-9 bg-blue-600 text-blue-600 ">
                                <AvatarFallback className="text-lg font-bold">{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 " align="end" forceMount>
                        <div className="flex items-center justify-start gap-2 p-2">
                            <div className="flex flex-col space-y-1 leading-none">
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="w-[200px] truncate text-sm text-gray-600">{user.email}</p>
                            </div>
                        </div>
                        <DropdownMenuItem onClick={logout} className="text-gray-700 hover:bg-gray-50">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            

            {/* Tower Selection */}
            <Card className="shadow-lg border-gray-200 bg-white mb-6">
                <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center">
                        <Building className="mr-2 h-5 w-5 text-blue-600" />
                        Seleccionar Torre
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Elige una de tus torres asignadas para comenzar las evaluaciones
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Select onValueChange={handleTowerSelect} disabled={loading} value={selectedTowerId?.toString() || ""}>
                            <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Selecciona una torre" />
                            </SelectTrigger>
                            <SelectContent>
                                {user.towers?.map((tower) => (
                                    <SelectItem key={tower.id} value={tower.id.toString()}>
                                        Torre {tower.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
                            <p className="text-gray-600">Cargando evaluaciones...</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Selection */}
            {evaluationData && !loading && (
                <Card className="shadow-lg border-gray-200 bg-white mb-6">
                    <CardHeader>
                        <CardTitle className="text-gray-900 flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-green-600" />
                            Seleccionar Encuesta
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Elige la encuesta que deseas completar para Torre: {selectedTower?.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1  gap-4 justify-center">
                            {evaluationData && !loading && (
                                <div className="space-y-6">
                                    {evaluationData.forms.map((form, index) => {
                                        const formColors = getClientFormColors(index)
                                        return (
                                            <Card
                                                key={form.id}
                                                className="shadow-lg border-0 overflow-hidden"
                                                style={{
                                                    backgroundColor: formColors.background,
                                                    borderLeft: `6px solid ${formColors.border}`
                                                }}
                                            >
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                                        <div className="p-2 rounded-full" style={{ backgroundColor: formColors.border }}>
                                                            <FileText className="h-5 w-5 text-white" />
                                                        </div>
                                                        {form.title}
                                                    </CardTitle>
                                                    <CardDescription
                                                        className="text-gray-700"
                                                        style={{ whiteSpace: "pre-line" }}
                                                    >
                                                        {form.description}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex justify-between items-center">
                                                        <div className="space-y-1">
                                                            <p className="text-sm text-gray-600">
                                                                Torre: <span className="font-medium text-gray-800">{selectedTower?.name}</span>
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Preguntas: <span className="font-medium text-gray-800">{form.questions.length}</span>
                                                            </p>
                                                        </div>
                                                        <Button
                                                            className="text-white hover:opacity-90 shadow-lg"
                                                            style={{ backgroundColor: formColors.border }}
                                                            onClick={() => handleFormSelect(form.id)}
                                                        >
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            Completar Evaluación
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-lg border-gray-200 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-gray-900 flex items-center text-lg">
                            <Users className="mr-2 h-5 w-5 text-green-600" />
                            Torres Asignadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{user.towers?.length || 0}</div>
                        <p className="text-gray-600 text-sm">Torres bajo tu responsabilidad</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-gray-200 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-gray-900 flex items-center text-lg">
                            <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                            Vista Matriz
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">3</div>
                        <p className="text-gray-600 text-sm">Opciones de visualización</p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-gray-200 bg-white">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-gray-900 flex items-center text-lg">
                            <Clock className="mr-2 h-5 w-5 text-orange-600" />
                            Evaluación Rápida
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">Bulk</div>
                        <p className="text-gray-600 text-sm">Evalúa todos a la vez</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
