"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Info, Lightbulb, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { InsightType, Priority } from "@/types/reports-types"

interface InsightBadgeProps {
  type: InsightType
  priority?: Priority
  message: string
  className?: string
}

export function InsightBadge({ type, priority = "medium", message, className }: InsightBadgeProps) {
  const getIcon = (): LucideIcon => {
    switch (type) {
      case "strength":
        return CheckCircle
      case "opportunity":
        return Lightbulb
      case "alert":
        return AlertTriangle
      case "recommendation":
        return Info
      default:
        return Info
    }
  }

  const getVariantStyles = () => {
    const baseStyles = "flex items-center gap-1 text-xs"

    switch (type) {
      case "strength":
        return cn(baseStyles, "bg-green-100 text-green-800 border-green-200")
      case "opportunity":
        return cn(baseStyles, "bg-blue-100 text-blue-800 border-blue-200")
      case "alert":
        return cn(baseStyles, "bg-red-100 text-red-800 border-red-200")
      case "recommendation":
        return cn(baseStyles, "bg-purple-100 text-purple-800 border-purple-200")
      default:
        return cn(baseStyles, "bg-gray-100 text-gray-800 border-gray-200")
    }
  }

  const getPriorityBorder = () => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500"
      case "medium":
        return "border-l-4 border-l-yellow-500"
      case "low":
        return "border-l-4 border-l-green-500"
      default:
        return ""
    }
  }

  const Icon = getIcon()

  return (
    <Badge className={cn(getVariantStyles(), getPriorityBorder(), className)}>
      <Icon className="h-3 w-3" />
      <span className="truncate max-w-xs" title={message}>
        {message}
      </span>
    </Badge>
  )
}
