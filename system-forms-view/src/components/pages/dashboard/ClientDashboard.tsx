
//Igual que el otro, este componente esta en desuso

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Eye } from "lucide-react"
import Link from "next/link"
import { getClientFormColors } from "@/constants/colors"
import { User } from "@/types/auth-types"
import { Tower } from "@/types/towers-types"
import { FormData } from "@/stores/form-store"

interface ClientDashboardProps {
    user: User;
    towers: Tower[];
    forms: FormData[]
}

export default function ClientDashboard({user, towers, forms}: ClientDashboardProps) {
    const userTowerId = user.towers?.[0]?.id;
    const userTower = towers.find(tower => Number(tower.id) === Number(userTowerId));
    const clientForms = forms.filter(form =>
      form.towers?.some(tower => Number(tower.id) === Number(userTowerId))
    );
    return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user.name}</h1>
          <p className="text-gray-600 mt-2">Completa las evaluaciones disponibles para {userTower?.name || 'tu torre'}</p>
        </div>
        {clientForms.length > 0 ? (
          clientForms.map((form, index) => {
            const formColors = getClientFormColors(index)
            return (
              <Card
                key={form.id}
                className="shadow-lg border-0 mb-6 overflow-hidden"
                style={{
                  backgroundColor: formColors.background,
                  borderLeft: `4px solid ${formColors.border}`
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <div className="p-1.5 rounded-full" style={{ backgroundColor: formColors.border }}>
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    {form.title}
                  </CardTitle>
                  <CardDescription className="text-gray-700">{form.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        Torre: <span className="font-medium text-gray-800">{userTower?.name}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Estado: <span className={`font-medium ${form.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                          {form.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </p>
                    </div>
                    <Link href={`/forms/${form.id}/fill`}>
                      <Button className="text-white hover:opacity-90 shadow-lg" style={{ backgroundColor: formColors.border }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Completar Evaluación
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="border-gray-200 bg-white">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes formularios pendientes</h3>
              <p className="text-gray-600">¡Felicidades! No tienes evaluaciones por completar en {userTower?.name || 'tu torre'}.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
