"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Loader2 } from "lucide-react"

export default function TesteWebhookPage() {
  const [pageId, setPageId] = useState("")
  const [status, setStatus] = useState("approved")
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        data: {
          order: {
            reference: "",
            status: "approved",
          },
        },
        token: "hbmn3ylowx3",
      },
      null,
      2,
    ),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const updatePayload = (id: string, paymentStatus: string) => {
    try {
      const data = JSON.parse(payload)
      if (data.data && data.data.order) {
        data.data.order.reference = id
        data.data.order.status = paymentStatus
      }
      setPayload(JSON.stringify(data, null, 2))
    } catch (e) {
      console.error("Erro ao atualizar payload:", e)
    }
  }

  const handlePageIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value
    setPageId(id)
    updatePayload(id, status)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    updatePayload(pageId, newStatus)
  }

  const handlePayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPayload(e.target.value)
  }

  const handleSubmit = async () => {
    if (!payload) {
      setError("Por favor, forneça um payload válido")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      let payloadObj
      try {
        payloadObj = JSON.parse(payload)
      } catch (e) {
        throw new Error("Payload JSON inválido")
      }

      // Adicionar o pageId como parâmetro de URL para garantir que funcione
      const response = await fetch(`/api/webhook/kiwify?reference=${pageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.KIWIFY_WEBHOOK_TOKEN || "hbmn3ylowx3"}`,
        },
        body: payload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar webhook")
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
              Teste do <span className="gradient-text">Webhook da Kiwify</span>
            </h1>
            <p className="mt-4 text-gray-400">
              Esta página permite testar a integração com o webhook da Kiwify para processar notificações de pagamento.
            </p>
          </div>

          <Card className="border-gray-800 bg-black/50 mb-8">
            <CardHeader>
              <CardTitle>Simular Webhook</CardTitle>
              <CardDescription>Preencha os dados para simular uma notificação de pagamento da Kiwify.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageId">ID da Página</Label>
                <Input id="pageId" value={pageId} onChange={handlePageIdChange} placeholder="Ex: abc123" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status do Pagamento</Label>
                <select
                  id="status"
                  value={status}
                  onChange={handleStatusChange}
                  className="w-full rounded-md border border-gray-800 bg-black p-2"
                >
                  <option value="approved">Aprovado</option>
                  <option value="pending">Pendente</option>
                  <option value="refused">Recusado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payload">Payload JSON</Label>
                <Textarea
                  id="payload"
                  value={payload}
                  onChange={handlePayloadChange}
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} className="w-full gradient-bg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Webhook"
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
