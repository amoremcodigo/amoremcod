"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Printer, Copy, Check, Phone } from "lucide-react"
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

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-400 text-center">Compartilhe esta página</h3>

      {/* QR Code */}
      {qrCodeDataUrl ? (
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-lg">
            <img src={qrCodeDataUrl || "/placeholder.svg"} alt="QR Code" className="w-32 h-32" />
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Link */}
      <div className="flex items-center bg-gray-800 rounded-lg p-2">
        <div className="flex-1 truncate text-sm text-gray-300 px-2">
          {url.length > 30 ? url.substring(0, 30) + "..." : url}
        </div>
        <Button variant="ghost" size="sm" onClick={copyLink} className="text-xs">
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>

      {/* Botões de ação */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadQRCode}
          className="flex items-center justify-center"
          disabled={!qrCodeDataUrl}
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar QR Code
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={printQRCode}
          className="flex items-center justify-center"
          disabled={!qrCodeDataUrl}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={shareViaWhatsApp}
          className="flex items-center justify-center col-span-2"
        >
          <Phone className="h-4 w-4 mr-2" />
          Compartilhar via WhatsApp
        </Button>
      </div>
    </div>
  )
}
