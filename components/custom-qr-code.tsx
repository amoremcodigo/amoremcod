"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2 } from "lucide-react"

interface CustomQRCodeProps {
  url: string
  size?: number
  logoSize?: number
  className?: string
}

// Usando exportação nomeada em vez de exportação padrão
export function CustomQRCode({ url, size = 300, logoSize = 60, className = "" }: CustomQRCodeProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true)

        // Usar a API QR Code Generator para gerar o QR code base
        const secureUrl = url.replace("http://", "https://")
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(secureUrl)}&margin=1&qzone=1&format=png&bgcolor=FFFFFF&color=000000&ecc=H`

        // Baixar a imagem do QR code
        const response = await fetch(qrCodeUrl)
        const blob = await response.blob()

        // Criar um canvas para adicionar o logo
        const canvas = canvasRef.current
        if (!canvas) {
          setError("Erro ao renderizar QR Code")
          return
        }

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          setError("Seu navegador não suporta esta funcionalidade")
          return
        }

        canvas.width = size
        canvas.height = size

        // Carregar o QR Code no canvas
        const qrImg = new Image()
        qrImg.crossOrigin = "anonymous"
        qrImg.src = URL.createObjectURL(blob)

        qrImg.onload = () => {
          // Desenhar o QR Code
          ctx.drawImage(qrImg, 0, 0, size, size)

          // Desenhar o círculo branco para o emoji
          ctx.fillStyle = "white"
          ctx.beginPath()
          ctx.arc(size / 2, size / 2, logoSize / 2, 0, Math.PI * 2)
          ctx.fill()

          // Desenhar o emoji de cadeado
          ctx.font = `${logoSize * 0.6}px Arial`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("🔒", size / 2, size / 2)

          // Converter para data URL
          const dataUrl = canvas.toDataURL("image/png")
          setQrImage(dataUrl)
          setLoading(false)

          // Limpar recursos
          URL.revokeObjectURL(qrImg.src)
        }

        qrImg.onerror = () => {
          setError("Erro ao carregar QR Code")
          setLoading(false)
        }
      } catch (error) {
        console.error("Erro ao gerar QR Code:", error)
        setError("Erro ao gerar QR Code")
        setLoading(false)
      }
    }

    generateQRCode()
  }, [url, size, logoSize])

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
      {/* Canvas escondido usado para gerar o QR Code */}
      <canvas ref={canvasRef} style={{ display: "none" }} width={size} height={size} />

      {/* QR Code renderizado */}
      {qrImage && <img src={qrImage || "/placeholder.svg"} alt="QR Code" className="w-full h-full" />}
    </div>
  )
}
