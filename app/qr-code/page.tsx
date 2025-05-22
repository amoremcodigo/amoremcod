"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Download, Share2 } from "lucide-react"
import { CustomQRCode } from "@/components/custom-qr-code"

export default function QRCodePage() {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText("https://amoremcodigo.com.br/pagina/exemplo123")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Seu QR Code está <span className="gradient-text">pronto!</span>
            </h1>
            <p className="mt-4 text-gray-400">
              Compartilhe este QR Code com seu amor para acessar a página personalizada.
            </p>
          </div>

          <Card className="border-gray-800 bg-black/50">
            <CardHeader>
              <CardTitle className="text-center">QR Code - Maria & João</CardTitle>
              <CardDescription className="text-center">Escaneie para acessar a página personalizada</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-64 w-64 bg-white p-4 rounded-lg flex items-center justify-center mb-6">
                <CustomQRCode url="https://amoremcodigo.com.br/pagina/exemplo123" size={240} />
              </div>

              <div className="w-full p-3 bg-gray-800 rounded-lg flex items-center justify-between mb-4">
                <span className="text-sm text-gray-300 truncate mr-2">amoremcodigo.com.br/pagina/exemplo123</span>
                <Button variant="ghost" size="sm" onClick={copyLink} className="text-xs">
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button className="w-full flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Baixar QR Code
              </Button>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400 mb-4">
              Seu QR Code e link da página foram enviados para seu e-mail. Verifique sua caixa de entrada e a pasta de
              spam.
            </p>
            <Button variant="link" className="text-primary">
              Voltar para a página inicial
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
