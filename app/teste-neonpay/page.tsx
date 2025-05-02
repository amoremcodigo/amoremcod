"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Loader2 } from "lucide-react"

export default function TesteNeonPayPage() {
  const [pageId, setPageId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckPayment = async () => {
    if (!pageId) {
      setError("Por favor, informe o ID da página")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/neonpay/check-payment?pageId=${pageId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao verificar pagamento")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
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
              Teste da <span className="gradient-text">API da NeonPay</span>
            </h1>
            <p className="mt-4 text-gray-400">
              Esta página permite testar a integração com a API da NeonPay para verificar o status de pagamentos.
            </p>
          </div>

          <Card className="border-gray-800 bg-black/50 mb-8">
            <CardHeader>
              <CardTitle>Verificar Pagamento</CardTitle>
              <CardDescription>Informe o ID da página para verificar o status do pagamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageId">ID da Página</Label>
                <Input
                  id="pageId"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  placeholder="Ex: abc123"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCheckPayment} className="w-full gradient-bg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar Pagamento"
                )}
              </Button>
            </CardFooter>
          </Card>

          {error && (
            <Card className="border-red-800 bg-red-950/30 mb-8">
              <CardHeader>
                <CardTitle className="text-red-500">Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="border-green-800 bg-green-950/30">
              <CardHeader>
                <CardTitle className="text-green-500">Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 p-4 rounded-md overflow-auto text-xs text-gray-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
