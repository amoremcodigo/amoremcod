"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

interface CustomQRCodeProps {
  url: string
  size?: number
  logoSize?: number
  className?: string
}

export function CustomQRCode({ url, size = 300, logoSize = 60, className = "" }: CustomQRCodeProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Usar uma abordagem mais simples com a API QR Code Generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=1&qzone=1&format=png&bgcolor=FFFFFF&color=000000&ecc=H`

  // Simular carregamento para dar tempo de carregar a imagem
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return <div className={`text-red-500 ${className}`}>{error}</div>
  }

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {/* QR Code base */}
      <img
        src={qrCodeUrl || "/placeholder.svg"}
        alt="QR Code"
        className="w-full h-full"
        onError={() => setError("Erro ao carregar QR Code")}
      />

      {/* Logo sobreposto */}
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: logoSize,
          height: logoSize,
          backgroundColor: "white",
          borderRadius: "50%",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="relative w-full h-full">
          <Image src="/logo-icon.png" alt="Logo" fill className="object-contain" />
        </div>
      </div>
    </div>
  )
}
