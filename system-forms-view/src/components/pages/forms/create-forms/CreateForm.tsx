"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { FormQuestion, useFormStore } from "@/stores/form-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { formsApi } from '@/api/forms/forms-endpoints'
import { useTowersStore } from "@/stores/towers-store"
import { getTowerColor } from "@/constants/colors" // ✅ Importar función helper

import { Plus, Trash2, Save, ArrowLeft, Star, MessageSquare, Hash, Building2, Sparkles } from "lucide-react"
import Link from "next/link"

const QUESTION_TYPES = [
  {
    value: "rating",
    label: "Calificación (Estrellas)",
    icon: Star,
    color: "bg-orange-500",
    description: "Permite calificar del 1 al 5 con estrellas",
  },
  {
    value: "text",
    label: "Texto Abierto",
    icon: MessageSquare,
    color: "bg-blue-500",
    description: "Respuesta de texto libre",
  },
  // {
  //   value: "number",
  //   label: "Número",
  //   icon: Hash,
  //   color: "bg-green-500",
  //   description: "Respuesta numérica",
  // },
]

const STAR_DESCRIPTIONS = [
  "Muy Insatisfecho - El servicio fue deficiente",
  "Insatisfecho - El servicio no cumplió mis expectativas",
  "Neutral / Regular - El servicio fue aceptable, pero mejorable",
  "Satisfecho - El servicio fue bueno",
  "Muy Satisfecho - El servicio fue excelente",
]

export default function CreateForm() {
  const { user, isAuthenticated, checkAuth, isInitialized } = useAuthStore()
  const { createForm, isLoading } = useFormStore() // ✅ Usar createForm del store
  const router = useRouter()
  const { towers, fetchTowers, isLoading: towersLoading } = useTowersStore()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetTowers: [] as string[],
    isActive: true,
  })

  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "text" as "rating" | "text" | "number",
    required: true,
    options: {},
  })

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user && user.role !== "superadmin") {
        router.push("/dashboard")
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  useEffect(() => {
    fetchTowers();
  }, [fetchTowers]);

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  const handleTowerToggle = (tower: string) => {
    setFormData((prev) => ({
      ...prev,
      targetTowers: prev.targetTowers.includes(tower)
        ? prev.targetTowers.filter((t) => t !== tower)
        : [...prev.targetTowers, tower],
    }))
  }

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) return

    const newQuestion: FormQuestion = {
      id: Date.now().toString(),
      text: currentQuestion.text,
      type: currentQuestion.type,
      required: currentQuestion.required,
      options:
        currentQuestion.type === "rating"
          ? { maxStars: 5, starDescriptions: STAR_DESCRIPTIONS }
          : currentQuestion.type === "text"
            ? { placeholder: "Escribe tu respuesta aquí..." }
            : {},
    }

    setQuestions((prev) => [...prev, newQuestion])
    setCurrentQuestion({
      text: "",
      type: "text",
      required: true,
      options: {},
    })
  }

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Por favor completa el título y descripción")
      return
    }

    if (formData.targetTowers.length === 0) {
      alert("Selecciona al menos una torre")
      return
    }

    if (questions.length === 0) {
      alert("Agrega al menos una pregunta")
      return
    }

    try {
      // Transformar las preguntas al formato que espera el backend
      const questionsForBackend = questions.map((question, index) => ({
        questionText: question.text,
        questionType: question.type,
        isRequired: question.required,
        position: index + 1,
        options: JSON.stringify(question.options || {})
      }))

      // Preparar los datos del formulario
      const backendFormData = {
        title: formData.title,
        description: formData.description,
        status: "active",
        isActive: formData.isActive,
        isAnonymous: false,
        towerIds: formData.targetTowers.map(id => parseInt(id)),
        questions: questionsForBackend
      }

      console.log('Sending to backend:', JSON.stringify(backendFormData, null, 2))

      // ✅ Usar el store en lugar de llamar directamente a la API
      await createForm(backendFormData)

      alert('Formulario creado exitosamente!')
      router.push("/forms")
    } catch (error: any) {
      console.error('Error creating form:', error)
      alert(`Error al crear el formulario: ${error.message}`)
    }
  }

  const renderQuestionPreview = (question: FormQuestion) => {
    switch (question.type) {
      case "rating":
        return (
          <div className="flex justify-center p-4 bg-orange-50 rounded-lg">
            <StarRating maxStars={5} readonly starDescriptions={STAR_DESCRIPTIONS} />
          </div>
        )
      case "number":
        return (
          <div className="p-4 bg-green-50 rounded-lg">
            <Input type="number" placeholder="0" disabled className="bg-white/50 border-gray-200" />
          </div>
        )
      case "text":
        return (
          <div className="p-4 bg-blue-50 rounded-lg">
            <Textarea placeholder="Respuesta..." disabled className="bg-white/50 border-gray-200" />
          </div>
        )
      default:
        return null
    }
  }

  const getQuestionTypeInfo = (type: string) => {
    return QUESTION_TYPES.find((t) => t.value === type) || QUESTION_TYPES[1]
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header con gradiente */}
        <div className="relative mb-8 p-6 rounded-2xl bg-blue-700 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/forms">
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
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Crear Formulario</h1>
                <p className="text-blue-100 mt-1 text-base">Diseña un formulario increíble para tus evaluaciones</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica con gradiente */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-6 w-6" />
                Información Básica
              </CardTitle>
              <CardDescription className="text-blue-100">
                Define los detalles principales del formulario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-medium text-gray-700">
                  Título del Formulario
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Evaluación de Servicio Técnico"
                  required
                  className="h-12 text-lg border-2 border-gray-300 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-lg font-medium text-gray-700">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el propósito de este formulario..."
                  required
                  className="min-h-[100px] text-lg border-2 border-gray-300 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  {towers.map((tower, index) => {
                    return (
                      <div
                        key={tower.id}
                        style={{ backgroundColor: getTowerColor(index) }}
                        className={`p-4 rounded-xl text-white shadow-lg hover:shadow-xl transition-all cursor-pointer ${formData.targetTowers.includes(tower.id) ? "ring-4 ring-white ring-opacity-50" : ""}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={tower.id}
                            checked={formData.targetTowers.includes(tower.id)}
                            onCheckedChange={() => handleTowerToggle(tower.id)}
                            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                          />
                          <Label htmlFor={tower.id} className="font-medium cursor-pointer">
                            {tower.name}
                          </Label>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {formData.targetTowers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.targetTowers.map((towerId) => {
                      const tower = towers.find(t => t.id === towerId);
                      const towerIndex = towers.findIndex(t => t.id === towerId);
                      
                      return (
                        <Badge 
                          key={towerId} 
                          style={{ backgroundColor: getTowerColor(towerIndex) }}
                          className="text-white px-3 py-1 border-0"
                        >
                          {tower?.name || towerId}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agregar preguntas with improved design */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-green-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-6 w-6" />
                Agregar Pregunta
              </CardTitle>
              <CardDescription className="text-green-100">
                Crea preguntas increíbles para tu formulario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="questionText" className="text-lg font-medium text-gray-700">
                  Texto de la Pregunta
                </Label>
                <Input
                  id="questionText"
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="¿Cómo calificarías...?"
                  className="h-12 text-lg border-2 border-gray-300 focus:border-green-500 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-medium text-gray-700">Tipo de Pregunta</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                  {QUESTION_TYPES.map((type) => {
                    const Icon = type.icon
                    const isSelected = currentQuestion.type === type.value
                    return (
                      <div
                        key={type.value}
                        onClick={() => setCurrentQuestion((prev) => ({ ...prev, type: type.value as any }))}
                        className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${isSelected
                          ? `${type.color} text-white border-transparent shadow-lg scale-105`
                          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                          }`}
                      >
                        <div className="text-center space-y-2">
                          <div
                            className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${isSelected ? "bg-white/20" : type.color
                              }`}
                          >
                            <Icon className={`h-6 w-6 ${isSelected ? "text-white" : "text-white"}`} />
                          </div>
                          <h3 className={`font-medium ${isSelected ? "text-white" : "text-gray-900"}`}>
                            {type.label}
                          </h3>
                          <p className={`text-sm ${isSelected ? "text-white/80" : "text-gray-600"}`}>
                            {type.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Checkbox
                  id="required"
                  checked={currentQuestion.required}
                  onCheckedChange={(checked) => setCurrentQuestion((prev) => ({ ...prev, required: !!checked }))}
                  className="data-[state=checked]:bg-green-500 border-gray-300"
                />
                <Label htmlFor="required" className="text-lg font-medium text-gray-700 cursor-pointer">
                  Pregunta obligatoria
                </Label>
              </div>

              <Button
                type="button"
                onClick={addQuestion}
                className="w-full h-14 text-lg bg-green-700 hover:bg-green-800 shadow-lg hover:shadow-xl transition-all text-white"
              >
                <Plus className="mr-2 h-5 w-5" />
                Agregar Pregunta
              </Button>
            </CardContent>
          </Card>

          {/* Lista de preguntas con mejor diseño */}
          {questions.length > 0 && (
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="bg-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="h-6 w-6" />
                  Preguntas del Formulario ({questions.length})
                </CardTitle>
                <CardDescription className="text-blue-100">Vista previa de las preguntas creadas</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {questions.map((question, index) => {
                    const typeInfo = getQuestionTypeInfo(question.type)
                    const TypeIcon = typeInfo.icon
                    return (
                      <div
                        key={question.id}
                        className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-md hover:shadow-lg transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-full ${typeInfo.color}`}>
                                <TypeIcon className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                Pregunta {index + 1}
                              </span>
                              <Badge className={`${typeInfo.color} text-white border-0`}>{typeInfo.label}</Badge>
                              {question.required && (
                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                  Obligatoria
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-lg text-gray-900 mb-4">{question.text}</p>
                            {renderQuestionPreview(question)}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción con gradientes */}
          <div className="flex justify-end gap-4 pt-6">
            <Link href="/forms">
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
              className="h-12 px-8 text-lg bg-blue-700 hover:bg-blue-800 shadow-lg hover:shadow-xl transition-all text-white"
            >
              <Save className="mr-2 h-5 w-5" />
              Crear Formulario
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
