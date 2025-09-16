"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { FormQuestion, useFormStore } from "@/stores/form-store"
import { useTowersStore } from "@/stores/towers-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { formsApi } from '@/api/forms/forms-endpoints'
import { getTowerColor } from "@/constants/colors" // ✅ Importar función helper
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

import { Plus, Trash2, Save, ArrowLeft, Star, MessageSquare, Hash, Building2, Sparkles } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const { user, isAuthenticated, isLoading } = useAuth()
  const { createForm, isLoading: formLoading } = useFormStore()
  const { towers, fetchTowers, isLoading: towersLoading } = useTowersStore()
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetTowers: [] as string[],
    isActive: true,
    // NUEVOS CAMPOS: tipo y fechas para periodic
    type: "single" as "single" | "periodic",
    startDay: undefined as number | undefined,
    endDay: undefined as number | undefined,
    autoActivate: false,
  })

  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "text" as "rating" | "text" | "number",
    required: true,
    options: {},
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTowers()
    }
  }, [isAuthenticated, user, fetchTowers])

  if (isLoading || towersLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null; // El AuthProvider se encarga de redirigir
  }

  if (user.role !== "superadmin") {
    router.push("/dashboard")
    return null
  }

  const handleTowerToggle = (towerId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetTowers: prev.targetTowers.includes(towerId)
        ? prev.targetTowers.filter((t) => t !== towerId)
        : [...prev.targetTowers, towerId],
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

    if (formLoading) return // Prevenir múltiples envíos

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

      const questionsForBackend = questions.map((question, index) => ({
        questionText: question.text,
        questionType: question.type,
        isRequired: question.required,
        position: index + 1,
        options: JSON.stringify(question.options || {})
      }))

      // Preparar los datos del formulario
      const backendFormData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type, // single o periodic
        status: "draft",
        isActive: true,
        isAnonymous: false,
        towerIds: formData.targetTowers.map(id => parseInt(id)),
        questions: questionsForBackend
      }

      if (formData.type === "periodic") {
        if (formData.startDay !== undefined) backendFormData.startDay = formData.startDay
        if (formData.endDay !== undefined) backendFormData.endDay = formData.endDay
        backendFormData.autoActivate = !!formData.autoActivate
      }

      console.log('Sending to backend:', JSON.stringify(backendFormData, null, 2))

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

              {/* Selector de tipo y campos para periodic - ajustado al estilo */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tipo de Formulario</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "single" | "periodic") =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="mt-1 h-10 border border-gray-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">🟢 Único</SelectItem>
                      <SelectItem value="periodic">🔵 Periódico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "periodic" && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-blue-800">Configuración Periódica</h4>
                      <p className="text-xs text-blue-600 mt-1">Define cuándo se activará automáticamente cada mes</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Día inicio (1-31)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`mt-1 h-10 w-full justify-start text-left font-normal border border-gray-300 focus:border-blue-500 ${
                                !formData.startDay ? "text-muted-foreground" : ""
                              }`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.startDay ? `Día ${formData.startDay}` : "Seleccionar día"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-4">
                              <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                  <Button
                                    key={day}
                                    variant={formData.startDay === day ? "default" : "outline"}
                                    size="sm"
                                    className={`h-8 w-8 p-0 text-xs ${
                                      formData.startDay === day 
                                        ? "bg-blue-500 text-white hover:bg-blue-600" 
                                        : "hover:bg-blue-50"
                                    }`}
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, startDay: day }))
                                    }}
                                  >
                                    {day}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-gray-500 mt-1">Día del mes en que se abrirá</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Día fin (1-31)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={`mt-1 h-10 w-full justify-start text-left font-normal border border-gray-300 focus:border-blue-500 ${
                                !formData.endDay ? "text-muted-foreground" : ""
                              }`}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.endDay ? `Día ${formData.endDay}` : "Seleccionar día"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-4">
                              <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                  <Button
                                    key={day}
                                    variant={formData.endDay === day ? "default" : "outline"}
                                    size="sm"
                                    className={`h-8 w-8 p-0 text-xs ${
                                      formData.endDay === day 
                                        ? "bg-blue-500 text-white hover:bg-blue-600" 
                                        : "hover:bg-blue-50"
                                    }`}
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, endDay: day }))
                                    }}
                                  >
                                    {day}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-gray-500 mt-1">Día del mes en que se cerrará</p>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-1">💡 Información importante:</p>
                      <p className="text-xs text-blue-600">
                        Si el día fin es menor al día inicio, significa que el formulario se cerrará el día especificado del <strong>mes siguiente</strong>.
                        <br />
                        Ejemplo: Inicio día 27, Fin día 5 = del 27 de enero al 5 de febrero.
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Checkbox
                        id="autoActivate"
                        checked={formData.autoActivate}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, autoActivate: !!checked }))
                        }
                      />
                      <Label htmlFor="autoActivate" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Activación automática
                      </Label>
                    </div>

                    {formData.startDay && formData.endDay && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium mb-1">📅 Resumen del periodo:</p>
                        {formData.endDay > formData.startDay ? (
                          <p className="text-sm text-green-700">
                            El formulario estará activo del <strong>día {formData.startDay} al {formData.endDay}</strong> del mismo mes.
                          </p>
                        ) : (
                          <p className="text-sm text-green-700">
                            El formulario estará activo del <strong>día {formData.startDay}</strong> hasta el <strong>día {formData.endDay} del mes siguiente</strong>.
                            <br />
                            <span className="text-xs">Ejemplo: Del 27 de enero al 5 de febrero, del 27 de febrero al 5 de marzo, etc.</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
              disabled={formLoading}
              className="h-12 px-8 text-lg bg-blue-700 hover:bg-blue-800 shadow-lg hover:shadow-xl transition-all text-white disabled:opacity-50"
            >
              <Save className="mr-2 h-5 w-5" />
              {formLoading ? 'Creando...' : 'Crear Formulario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
