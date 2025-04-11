"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Printer, Phone, Share2 } from "lucide-react"
import QRCode from "qrcode"

interface QRCodeShareProps {
  url: string
  coupleNames: string
}

export function QRCodeShare({ url, coupleNames }: QRCodeShareProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  // Gerar QR Code ao carregar o componente
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 200,
          margin: 1,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
        setQrCodeDataUrl(dataUrl)
      } catch (error) {
        console.error("Erro ao gerar QR Code:", error)
      }
    }

    generateQRCode()
  }, [url])

  // Função para copiar o link
  const copyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Função para baixar o QR Code
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement("a")
    link.href = qrCodeDataUrl
    link.download = `qrcode-${coupleNames.replace(/\s+/g, "-").toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Função para imprimir o QR Code
  const printQRCode = () => {
    if (!qrCodeDataUrl) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <html>
        <head>
          <title>QR Code - ${coupleNames}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
            }
            img {
              max-width: 300px;
              margin-bottom: 20px;
            }
            h2 {
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 20px;
              color: #666;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${coupleNames}</h2>
            <p>Escaneie o QR Code para acessar nossa página personalizada</p>
            <img src="${qrCodeDataUrl}" alt="QR Code" />
            <p>${url}</p>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  // Função para compartilhar via WhatsApp
  const shareViaWhatsApp = () => {
    const message = `Olá! Veja nossa página personalizada: ${url}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  // Função para compartilhar usando a Web Share API (se disponível)
  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Página de ${coupleNames}`,
          text: `Veja nossa página personalizada!`,
          url: url,
        })
      } catch (error) {
        console.error("Erro ao compartilhar:", error)
        // Fallback para copiar o link
        copyLink()
      }
    } else {
      // Fallback para copiar o link
      copyLink()
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-base font-medium text-white text-center">Compartilhe esta página</h3>

      {/* QR Code com design melhorado */}
      {qrCodeDataUrl ? (
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
            <img src={qrCodeDataUrl || "/placeholder.svg"} alt="QR Code" className="w-40 h-40" />
          </div>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Botões de ação com visual melhorado */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="default"
          size="lg"
          onClick={shareViaWebShare}
          className="flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md"
        >
          <Share2 className="h-5 w-5 mr-2" />
          Compartilhar
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={shareViaWhatsApp}
          className="flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
        >
          <Phone className="h-5 w-5 mr-2" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={downloadQRCode}
          className="flex items-center justify-center border-2 border-pink-500 text-pink-500 hover:bg-pink-500/10 shadow-md col-span-1"
          disabled={!qrCodeDataUrl}
        >
          <Download className="h-5 w-5 mr-2" />
          Baixar QR
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={printQRCode}
          className="flex items-center justify-center border-2 border-purple-500 text-purple-500 hover:bg-purple-500/10 shadow-md col-span-1"
          disabled={!qrCodeDataUrl}
        >
          <Printer className="h-5 w-5 mr-2" />
          Imprimir
        </Button>
      </div>
    </div>
  )
}
