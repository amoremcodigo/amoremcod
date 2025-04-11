"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PhotoCarouselProps {
  photos: string[]
  interval?: number
}

export function PhotoCarousel({ photos, interval = 3000 }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Efeito para alternar automaticamente as fotos
  useEffect(() => {
    if (photos.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length)
    }, interval)

    return () => clearInterval(timer)
  }, [photos.length, interval])

  // Função para navegar para a foto anterior
  const prevPhoto = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? photos.length - 1 : prevIndex - 1))
  }

  // Função para navegar para a próxima foto
  const nextPhoto = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length)
  }

  // Se não houver fotos, mostrar placeholder
  if (photos.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Sem foto</p>
      </div>
    )
  }

  // Se houver apenas uma foto, mostrar sem controles
  if (photos.length === 1) {
    return <img src={photos[0] || "/placeholder.svg"} alt="Foto do casal" className="w-full h-full object-cover" />
  }

  // Se houver múltiplas fotos, mostrar carrossel com controles
  return (
    <div className="relative w-full h-full">
      {/* Mostrar a foto atual */}
      <img
        src={photos[currentIndex] || "/placeholder.svg"}
        alt={`Foto do casal ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-500"
      />

      {/* Controles do carrossel */}
      <button
        onClick={prevPhoto}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 text-white z-10"
        aria-label="Foto anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={nextPhoto}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 text-white z-10"
        aria-label="Próxima foto"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Indicadores de foto */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {photos.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full ${index === currentIndex ? "w-3 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  )
}
