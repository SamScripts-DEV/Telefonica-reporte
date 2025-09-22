"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max: number
  variant?: "default" | "success" | "warning" | "error"
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, max, variant = "default", showLabel = false, className }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-300 ease-in-out", getVariantStyles(variant))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{value.toFixed(1)}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}
