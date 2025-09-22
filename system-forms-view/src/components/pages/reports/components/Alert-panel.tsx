"use client"

import { AlertTriangle, Info, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Alert {
  type: "warning" | "info" | "error"
  category: string
  title: string
  message: string
  data?: any
}

interface AlertPanelProps {
  alerts: Alert[]
  className?: string
}

export function AlertPanel({ alerts, className }: AlertPanelProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      case "info":
        return <Info className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "error":
        return {
          border: "border-l-red-500",
          bg: "bg-red-50",
          icon: "text-red-600",
          title: "text-red-800",
          message: "text-red-700",
        }
      case "warning":
        return {
          border: "border-l-yellow-500",
          bg: "bg-yellow-50",
          icon: "text-yellow-600",
          title: "text-yellow-800",
          message: "text-yellow-700",
        }
      case "info":
        return {
          border: "border-l-blue-500",
          bg: "bg-blue-50",
          icon: "text-blue-600",
          title: "text-blue-800",
          message: "text-blue-700",
        }
      default:
        return {
          border: "border-l-gray-500",
          bg: "bg-gray-50",
          icon: "text-gray-600",
          title: "text-gray-800",
          message: "text-gray-700",
        }
    }
  }

  if (alerts.length === 0) return null

  return (
    <Card className={cn("shadow-lg border-gray-200 bg-white", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const styles = getAlertStyles(alert.type)
            return (
              <div key={index} className={cn("border-l-4 p-3 rounded-r-md", styles.border, styles.bg)}>
                <div className="flex items-start">
                  <div className={cn("mr-3 mt-0.5", styles.icon)}>{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <h4 className={cn("font-medium text-sm", styles.title)}>{alert.title}</h4>
                    <p className={cn("text-sm mt-1", styles.message)}>{alert.message}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
