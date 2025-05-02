"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ObrigadoPage() {
  const [pageId, setPageId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkCount, setCheckCount] = useState(0)

  useEffect(() => {
    // Recuperar o ID da página do localStorage
    const storedPageId = localStorage.getItem("lastPageId")
    setPageId(storedPageId)

    if (storedPageId) {
      checkPaymentStatus(storedPageId)
    } else {
      setIsLoading(false)
      setError("Não foi possível identificar sua página. Por favor, entre em contato com o suporte.")
    }
  }, [])

  // Verificar o status do pagamento a cada 10 segundos (limitado a 10 tentativas)
  useEffect(() => {
    if (!pageId || checkCount >= 10 || paymentStatus === "approved" || paymentStatus === "paid") {
      return
    }

    const timer = setTimeout(() => {
      checkPaymentStatus(pageId)
      setCheckCount((prev) => prev + 1)
    }, 10000)

    return () => clearTimeout(timer)
  }, [pageId, checkCount, paymentStatus])

  const checkPaymentStatus = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Verificar o status diretamente no banco de dados
      const response = await fetch(`/api/pages/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao verificar pagamento")
      }

      setPaymentStatus(data.payment_status)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualCheck = () => {
    if (pageId) {
      checkPaymentStatus(pageId)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Obrigado pela sua <span className="gradient-text">compra!</span>
            </h1>
            <p className="mt-4 text-gray-400">
              Estamos processando seu pagamento e em breve você receberá o acesso à sua página personalizada.
            </p>
          </div>

          <Card className="border-gray-800 bg-black/50 mb-8">
            <CardHeader>
              <CardTitle>Status do Pagamento</CardTitle>
              <CardDescription>{pageId ? `ID da sua página: ${pageId}` : "Verificando informações..."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-gray-400">Verificando o status do seu pagamento...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                  <p className="text-amber-400 mb-4">{error}</p>
                  <Button onClick={handleManualCheck} variant="outline">
                    Tentar Novamente
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {paymentStatus === "approved" || paymentStatus === "paid" ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-xl font-bold text-green-500 mb-2">Pagamento Confirmado!</h3>
                      <p className="text-gray-400 text-center mb-6">
                        Seu pagamento foi confirmado com sucesso. Enviamos um email com o QR Code e o link da sua página
                        personalizada.
                      </p>
                      <Link href={`/pagina/${pageId}`}>
                        <Button className="gradient-bg">
                          Acessar Minha Página <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                      <h3 className="text-xl font-bold text-amber-500 mb-2">Pagamento Pendente</h3>
                      <p className="text-gray-400 text-center mb-6">
                        Seu pagamento ainda está sendo processado. Isso pode levar alguns minutos. Você receberá um
                        email assim que o pagamento for confirmado.
                      </p>
                      <Button onClick={handleManualCheck} variant="outline">
                        Verificar Novamente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Se você tiver alguma dúvida ou precisar de ajuda, entre em contato com nosso suporte.
            </p>
            <Link href="/">
              <Button variant="outline">Voltar para a Página Inicial</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
