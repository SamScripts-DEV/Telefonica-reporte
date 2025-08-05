"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useFormStore } from "@/stores/form-store"
import { useTowersStore } from "@/stores/towers-store" // ✅ AGREGAR esta importación
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StarRating } from "@/components/ui/star-rating"
import { CheckCircle, ArrowLeft, UserRound } from "lucide-react"
import Link from "next/link"

export default function FormToFill({formId}: {formId: string}) {
  const { user, isAuthenticated, checkAuth, isInitialized } = useAuthStore()
  // ✅ CAMBIO: Agregar submitForm del store
  const { currentForm, getFormById, submitForm, isLoading } = useFormStore()
  const { towers } = useTowersStore()
  const router = useRouter()
  const params = useParams()
  

  const [responses, setResponses] = useState<Record<string, any>>({})
  const [selectedTechnician, setSelectedTechnician] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  // ✅ CAMBIO: Cargar formulario usando store
  useEffect(() => {
    if (formId) {
      getFormById(formId)
    }
  }, [formId, getFormById])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user && user.role !== "client") {
        router.push("/dashboard")
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  // ✅ CAMBIO: Usar currentForm del store y verificar loading
  if (!isInitialized || !user || isLoading || !currentForm) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  // ✅ CAMBIO: Obtener técnicos desde la torre del usuario (como en Dashboard)
  let userTowerId: number | null = null;
  if (user.towers && user.towers.length > 0) {
    userTowerId = user.towers[0].id
  }

  const userTower = towers.find(tower => 
    userTowerId !== null && Number(tower.id) === Number(userTowerId)
  )

  // ✅ Obtener técnicos de la torre del usuario
  const availableTechnicians = userTower?.technicians || []
  
  console.log('👥 Técnicos disponibles:', availableTechnicians)
  console.log('🏢 Torre del usuario:', userTower)
  console.log('🆔 userTowerId:', userTowerId)

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTechnician) {
      alert("Por favor selecciona un técnico")
      return
    }

    // Validar preguntas requeridas
    const requiredQuestions = currentForm.questions?.filter((q: any) => q.isRequired) || []
    const missingResponses = requiredQuestions.filter((q: any) => !responses[q.id])

    if (missingResponses.length > 0) {
      alert("Por favor completa todas las preguntas obligatorias")
      return
    }

    try {
      // ✅ CAMBIO: Transformar respuestas al formato correcto
      const answers = Object.entries(responses)
        .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
        .map(([questionId, value]) => ({
          questionId,
          value: String(value) // Convertir a string para consistencia
        }))

      // ✅ AGREGAR: Logs detallados
      console.log('📤 Datos que se van a enviar:')
      console.log('  - FormId:', currentForm.id)
      console.log('  - Answers:', answers)
      console.log('  - Selected Technician:', selectedTechnician)
      console.log('  - User:', user)
      console.log('  - Raw responses:', responses)

      // ✅ CAMBIO: Incluir técnico en la petición si es necesario
      const payload = {
        answers,
        technicianId: selectedTechnician // El backend podría necesitar esto
      }

      console.log('📦 Payload final:', payload)

      // ✅ CAMBIO: Usar submitForm del store
      const response = await submitForm(currentForm.id, answers, selectedTechnician)
      
      console.log('✅ Formulario enviado exitosamente:', response)
      setIsSubmitted(true)

    } catch (error: any) {
      console.error('❌ Error enviando formulario:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      console.error('❌ Error headers:', error.response?.headers)
      
      alert(`Error al enviar el formulario: ${error.response?.data?.message || error.message || 'Error desconocido'}`)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-0 shadow-xl bg-white">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Evaluación Enviada!</h2>
            <p className="text-gray-600 mb-6">Gracias por completar la evaluación. Tu feedback es muy valioso.</p>
            <Link href="/dashboard">
              <Button className="w-full bg-green-600 hover:bg-green-700 shadow-lg text-white">
                Volver al Inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ✅ CAMBIO: Normalizar tipos de pregunta para soportar mayúsculas y minúsculas
  const renderQuestion = (question: any) => {
    console.log('🔍 Renderizando pregunta:', question)
    
    // ✅ Normalizar el tipo a mayúsculas para comparación consistente
    const questionType = question.questionType?.toUpperCase()
    
    switch (questionType) {
      case "MULTIPLE_CHOICE":
        return (
          <Select
            value={responses[question.id] || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <SelectTrigger className="h-12 text-lg border-2 border-gray-300 focus:border-green-500 transition-colors">
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "RATING":
        const ratingOptions = question.options ? JSON.parse(question.options) : null
        const maxStars = ratingOptions?.maxStars || 5
        const starDescriptions = ratingOptions?.starDescriptions || []

        return (
          <div className="space-y-4">
            <StarRating
              value={responses[question.id] || 0}
              onChange={(rating) => handleResponseChange(question.id, rating)}
              maxStars={maxStars}
              starDescriptions={starDescriptions}
              size="lg"
            />
          </div>
        )

      // ✅ CAMBIO: Soportar tanto "TEXT" como "text"
      case "TEXT":
        return (
          <Input
            type="text"
            value={responses[question.id] || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="h-12 text-lg border-2 border-gray-300 focus:border-green-500 transition-colors"
          />
        )

      case "TEXTAREA":
        return (
          <Textarea
            value={responses[question.id] || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="min-h-[100px] text-lg border-2 border-gray-300 focus:border-blue-500 transition-colors"
          />
        )

      default:
        console.warn('⚠️ Tipo de pregunta no soportado:', question.questionType)
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              Tipo de pregunta no soportado: <strong>{question.questionType}</strong>
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              Tipos soportados: text, textarea, multiple_choice, rating
            </p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header con gradiente coherente */}
        <div className="relative mb-8 p-6 rounded-2xl bg-green-700 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                {/* ✅ CAMBIO: Usar currentForm */}
                <h1 className="text-2xl font-bold">{currentForm.title}</h1>
                <p className="text-green-100 mt-1">{currentForm.description}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de técnico */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserRound className="h-6 w-6" />
                Seleccionar Técnico
              </CardTitle>
              <CardDescription className="text-blue-100">Elige el técnico que vas a evaluar</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="h-12 text-lg border-2 border-gray-300 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Selecciona un técnico" />
                </SelectTrigger>
                <SelectContent>
                  {availableTechnicians.map((tech: any) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name} - {tech.tower}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* ✅ CAMBIO: Usar currentForm.questions y ajustar estructura */}
          {currentForm.questions?.map((question: any, index: number) => (
            <Card key={question.id} className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-green-700 text-white rounded-t-lg">
                <CardTitle className="text-lg">
                  Pregunta {index + 1}
                  {question.isRequired && <span className="text-red-300 ml-1">*</span>}
                </CardTitle>
                <CardDescription className="text-green-100">{question.questionText}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">{renderQuestion(question)}</CardContent>
            </Card>
          ))}

          {/* Botón de envío */}
          <div className="flex justify-end gap-4 pt-6">
            <Link href="/dashboard">
              <Button
                type="button"
                variant="outline"
                className="h-12 px-8 text-lg bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 text-lg bg-green-700 hover:bg-green-800 shadow-lg text-white"
            >
              Enviar Evaluación
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
