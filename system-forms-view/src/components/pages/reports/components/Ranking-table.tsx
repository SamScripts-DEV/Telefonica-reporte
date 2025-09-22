"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"

interface RankingItem {
  rank: number
  name: string
  score: number
  subtitle: string
  badge: "success" | "warning" | "error" | "default"
  badgeText: string
  onClick?: () => void
}

interface RankingTableProps {
  data: RankingItem[]
  scoreLabel?: string
  scoreUnit?: string
}

export function RankingTable({ data, scoreLabel = "Calificación", scoreUnit = "" }: RankingTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return <span className="text-sm font-medium text-gray-600">#{rank}</span>
    }
  }

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case "success":
        return "default" // Verde
      case "warning":
        return "secondary" // Amarillo
      case "error":
        return "destructive" // Rojo
      default:
        return "outline" // Gris
    }
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div
          key={item.rank}
          className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center justify-center w-8">{getRankIcon(item.rank)}</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <p className="text-sm text-gray-600">{item.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="font-bold text-gray-900">
                {typeof item.score === "number" ? item.score.toFixed(1) : item.score}
                {scoreUnit}
              </div>
              <div className="text-xs text-gray-500">{scoreLabel}</div>
            </div>
            <Badge variant={getBadgeVariant(item.badge)}>{item.badgeText}</Badge>
            {item.onClick && (
              <Button variant="ghost" size="sm" onClick={item.onClick}>
                Ver
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
