"use client"

import { useState, useEffect } from "react"
import { Gift } from "lucide-react"

export function PromoBar() {
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    // Function to get and format the current date in Brasilia timezone
    const updateDate = () => {
      const now = new Date()

      // Format date as DD/MM/YYYY in Brasilia timezone (UTC-3)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }

      const formattedDate = new Intl.DateTimeFormat("pt-BR", options).format(now)
      setCurrentDate(formattedDate)
    }

    // Update date immediately
    updateDate()

    // Set up interval to check and update date every minute
    const intervalId = setInterval(() => {
      updateDate()
    }, 60000) // Check every minute

    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="relative w-full">
      {/* Efeito de onda infinita na parte superior */}
      <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
        <div className="wave-animation"></div>
      </div>

      <div className="w-full py-2 px-4 text-center text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-4 w-4" />
          <p>Apenas hoje ({currentDate}) – Planos com 50% de desconto, aproveite!</p>
        </div>
      </div>
    </div>
  )
}
