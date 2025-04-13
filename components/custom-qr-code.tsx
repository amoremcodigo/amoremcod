"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import Image from "next/image"
import { Loader2 } from "lucide-react"

interface CustomQRCodeProps {
  url: string
  size?: number
  logoSize?: number
  className?: string
  bgColor?: string
  fgColor?: string
  logoUrl?: string
}

export function CustomQRCode({
  url,
  size = 300,
  logoSize = 60,
  className = "",
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  logoUrl = "/logo-icon.png", // Default to site logo
}: CustomQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!url) return

    const generateQRCode = async () => {
      try {
        setLoading(true)
        setError(null)

        // Create QR code with extra padding in the center for the logo
        const qrOptions = {
          errorCorrectionLevel: "H", // High error correction to allow for logo overlay
          margin: 1,
          width: size,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        }

        // Generate QR code to canvas
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, url, qrOptions)

          // Get canvas context
          const ctx = canvasRef.current.getContext("2d")
          if (ctx) {
            // Clear the center area for the logo
            const centerPosition = size / 2
            const clearSize = logoSize + 10 // Add some padding around the logo
            ctx.fillStyle = bgColor
            ctx.fillRect(centerPosition - clearSize / 2, centerPosition - clearSize / 2, clearSize, clearSize)

            // Convert canvas to data URL
            const dataUrl = canvasRef.current.toDataURL("image/png")
            setQrDataUrl(dataUrl)
          }
        }
      } catch (err) {
        console.error("Error generating QR code:", err)
        setError("Failed to generate QR code")
      } finally {
        setLoading(false)
      }
    }

    generateQRCode()
  }, [url, size, bgColor, fgColor, logoSize])

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
      {qrDataUrl && (
        <>
          <img src={qrDataUrl || "/placeholder.svg"} alt="QR Code" className="w-full h-full" />
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: logoSize,
              height: logoSize,
            }}
          >
            <Image
              src={logoUrl || "/placeholder.svg"}
              alt="Logo"
              width={logoSize}
              height={logoSize}
              className="object-contain"
            />
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" width={size} height={size} />
    </div>
  )
}
