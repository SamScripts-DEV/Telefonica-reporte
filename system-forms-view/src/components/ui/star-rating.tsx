"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  maxStars?: number
  value?: number
  onChange?: (rating: number) => void
  readonly?: boolean
  starDescriptions?: string[]
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function StarRating({
  maxStars = 5,
  value = 0,
  onChange,
  readonly = false,
  starDescriptions = [],
  className,
  size = "md"
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [showDescription, setShowDescription] = useState(false)

  // Definir tamaños de estrellas
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-10 w-10"
  }

  // Definir tamaños de texto para descripciones
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base", 
    xl: "text-lg"
  }

  // Definir espaciado entre estrellas
  const spacingClasses = {
    sm: "gap-1",
    md: "gap-1",
    lg: "gap-2",
    xl: "gap-3"
  }

  const currentRating = readonly ? value : (hoverRating || value)
  const currentDescription = starDescriptions[currentRating - 1]

  const handleStarClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  const handleStarHover = (rating: number) => {
    if (!readonly) {
      setHoverRating(rating)
      setShowDescription(true)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
      setShowDescription(false)
    }
  }

  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <div 
        className={cn("flex", spacingClasses[size])}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= currentRating
          
          return (
            <button
              key={index}
              type="button"
              disabled={readonly}
              className={cn(
                "transition-all duration-200 ease-in-out",
                !readonly && "hover:scale-110 cursor-pointer",
                readonly && "cursor-default"
              )}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors duration-200",
                  isFilled 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "fill-gray-200 text-gray-300",
                  !readonly && "hover:fill-yellow-300 hover:text-yellow-300"
                )}
              />
            </button>
          )
        })}
      </div>
      
      {/* Mostrar descripción si existe */}
      {currentDescription && (showDescription || readonly) && (
        <div className={cn(
          "text-center text-gray-600 font-medium max-w-xs px-3 py-2 bg-gray-50 rounded-lg border",
          textSizeClasses[size]
        )}>
          {currentDescription}
        </div>
      )}
      
      {/* Mostrar rating actual */}
      {currentRating > 0 && (
        <div className={cn(
          "text-gray-500 font-medium",
          textSizeClasses[size]
        )}>
          {currentRating} de {maxStars} estrellas
        </div>
      )}
    </div>
  )
}
