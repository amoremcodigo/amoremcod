"use client"

import { useEffect, useRef } from "react"

export function FaviconGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Função para gerar os favicons em diferentes tamanhos
    const generateFavicons = () => {
      // Tamanhos comuns de favicon
      const sizes = [16, 32, 48, 64, 96, 128, 192, 512]

      sizes.forEach((size) => {
        // Configurar o tamanho do canvas
        canvas.width = size
        canvas.height = size

        // Limpar o canvas
        ctx.clearRect(0, 0, size, size)

        // Desenhar o fundo roxo com cantos arredondados
        ctx.fillStyle = "#9333EA" // Cor primária (roxo)
        ctx.beginPath()
        const radius = size * 0.125 // Raio dos cantos arredondados (1/8 do tamanho)
        ctx.moveTo(radius, 0)
        ctx.lineTo(size - radius, 0)
        ctx.quadraticCurveTo(size, 0, size, radius)
        ctx.lineTo(size, size - radius)
        ctx.quadraticCurveTo(size, size, size - radius, size)
        ctx.lineTo(radius, size)
        ctx.quadraticCurveTo(0, size, 0, size - radius)
        ctx.lineTo(0, radius)
        ctx.quadraticCurveTo(0, 0, radius, 0)
        ctx.closePath()
        ctx.fill()

        // Desenhar o QR code (fundo branco com cantos arredondados)
        const qrMargin = size * 0.1875 // Margem do QR code (3/16 do tamanho)
        const qrSize = size - qrMargin * 2 // Tamanho do QR code
        const qrRadius = qrSize * 0.1 // Raio dos cantos do QR code

        ctx.fillStyle = "white"
        ctx.beginPath()
        ctx.moveTo(qrMargin + qrRadius, qrMargin)
        ctx.lineTo(qrMargin + qrSize - qrRadius, qrMargin)
        ctx.quadraticCurveTo(qrMargin + qrSize, qrMargin, qrMargin + qrSize, qrMargin + qrRadius)
        ctx.lineTo(qrMargin + qrSize, qrMargin + qrSize - qrRadius)
        ctx.quadraticCurveTo(qrMargin + qrSize, qrMargin + qrSize, qrMargin + qrSize - qrRadius, qrMargin + qrSize)
        ctx.lineTo(qrMargin + qrRadius, qrMargin + qrSize)
        ctx.quadraticCurveTo(qrMargin, qrMargin + qrSize, qrMargin, qrMargin + qrSize - qrRadius)
        ctx.lineTo(qrMargin, qrMargin + qrRadius)
        ctx.quadraticCurveTo(qrMargin, qrMargin, qrMargin + qrRadius, qrMargin)
        ctx.closePath()
        ctx.fill()

        // Desenhar os blocos do QR code
        const blockSize = qrSize / 5 // Tamanho dos blocos do QR code
        ctx.fillStyle = "black"

        // Bloco superior esquerdo
        ctx.fillRect(qrMargin + blockSize * 0.5, qrMargin + blockSize * 0.5, blockSize * 1.5, blockSize * 1.5)

        // Bloco superior direito
        ctx.fillRect(qrMargin + qrSize - blockSize * 2, qrMargin + blockSize * 0.5, blockSize * 1.5, blockSize * 1.5)

        // Bloco inferior esquerdo
        ctx.fillRect(qrMargin + blockSize * 0.5, qrMargin + qrSize - blockSize * 2, blockSize * 1.5, blockSize * 1.5)

        // Desenhar o coração
        const heartSize = blockSize * 1.8
        const heartX = qrMargin + qrSize - heartSize * 0.8
        const heartY = qrMargin + qrSize - heartSize * 0.8

        ctx.fillStyle = "#EC4899" // Cor rosa
        ctx.beginPath()

        // Desenhar o coração usando curvas de Bézier
        ctx.moveTo(heartX, heartY + heartSize * 0.3)
        ctx.bezierCurveTo(
          heartX,
          heartY,
          heartX - heartSize * 0.5,
          heartY,
          heartX - heartSize * 0.5,
          heartY + heartSize * 0.3,
        )
        ctx.bezierCurveTo(
          heartX - heartSize * 0.5,
          heartY + heartSize * 0.6,
          heartX,
          heartY + heartSize * 0.8,
          heartX,
          heartY + heartSize,
        )
        ctx.bezierCurveTo(
          heartX,
          heartY + heartSize * 0.8,
          heartX + heartSize * 0.5,
          heartY + heartSize * 0.6,
          heartX + heartSize * 0.5,
          heartY + heartSize * 0.3,
        )
        ctx.bezierCurveTo(heartX + heartSize * 0.5, heartY, heartX, heartY, heartX, heartY + heartSize * 0.3)
        ctx.closePath()
        ctx.fill()

        // Gerar a URL de dados para o favicon
        const dataUrl = canvas.toDataURL(`image/png`)

        // Exibir no console (em um ambiente real, você salvaria esses arquivos)
        console.log(`Favicon ${size}x${size} gerado:`, dataUrl.substring(0, 50) + "...")

        // Em um ambiente de desenvolvimento real, você salvaria esses arquivos
        // usando uma API do servidor ou ferramentas de build
      })
    }

    // Gerar os favicons
    generateFavicons()
  }, [])

  return (
    <div className="hidden">
      <canvas ref={canvasRef} width="32" height="32"></canvas>
    </div>
  )
}
