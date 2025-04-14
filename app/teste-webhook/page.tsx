"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Loader2, Copy, Check, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TesteWebhookPage() {
  const [pageId, setPageId] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState("paid")
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        order_id: "dcf5fb8c-e611-4d1d-9b6a-abe89d39054c",
        order_ref: "ItTftqU",
        order_status: "paid",
        customer_email: "",
        token: "qsdl3p7msh4",
      },
      null,
      2,
    ),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState("")

  // Set the origin only on the client side
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const updatePayload = (id: string, customerEmail: string, paymentStatus: string) => {
    try {
      const data = JSON.parse(payload)
      // Atualizar no formato real da Kiwify
      data.order_ref = id
      data.customer_email = customerEmail
      data.order_status = paymentStatus
      setPayload(JSON.stringify(data, null, 2))
    } catch (e) {
      console.error("Erro ao atualizar payload:", e)
    }
  }

  const handlePageIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value
    setPageId(id)
    updatePayload(id, email, status)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    updatePayload(pageId, newEmail, status)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setStatus(newStatus)
    updatePayload(pageId, email, newStatus)
  }

  const handlePayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPayload(e.target.value)
  }

  const handleSubmitWebhook = async () => {
    if (!email) {
      setError("Por favor, informe o e-mail do cliente")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/webhook/kiwify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.KIWIFY_WEBHOOK_TOKEN || "qsdl3p7msh4"}`,
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

  const handleSubmitSimples = async () => {
    if (!email) {
      setError("Por favor, informe o e-mail do cliente")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Usar o webhook simples
      const response = await fetch(`/api/webhook/simples?email=${encodeURIComponent(email)}&status=${status}`)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar webhook simples")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  // Função para copiar a URL do webhook para o clipboard
  const copyWebhookUrl = () => {
    const webhookUrl = `${origin}/api/webhook/kiwify`
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Teste do <span className="gradient-text">Webhook</span>
            </h1>
            <p className="mt-4 text-gray-400">
              Esta página permite testar a integração com o webhook para processar notificações de pagamento.
            </p>
          </div>

          <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-500 mb-1">Importante: Novo Método</h3>
              <p className="text-sm text-amber-300/80">
                Agora usamos o e-mail do cliente para identificar a página correta. O ID da página não é mais necessário
                no webhook, pois o sistema encontrará a página automaticamente pelo e-mail.
              </p>
            </div>
          </div>

          <Tabs defaultValue="normal">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="normal">Webhook Normal</TabsTrigger>
              <TabsTrigger value="simples">Webhook Simples</TabsTrigger>
            </TabsList>

            <TabsContent value="normal">
              <Card className="border-gray-800 bg-black/50 mb-8">
                <CardHeader>
                  <CardTitle>Simular Webhook</CardTitle>
                  <CardDescription>
                    Preencha os dados para simular uma notificação de pagamento da Kiwify.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-amber-400">
                      E-mail do Cliente (obrigatório)
                    </Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="cliente@exemplo.com"
                      className="border-amber-800/50 focus:border-amber-500"
                    />
                    <p className="text-xs text-amber-400">
                      Este e-mail será usado para encontrar a página correta na Supabase.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pageId">ID da Venda (opcional)</Label>
                    <Input id="pageId" value={pageId} onChange={handlePageIdChange} placeholder="Ex: abc123" />
                    <p className="text-xs text-gray-400">Este é apenas o ID da venda na Kiwify, não o ID da página.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status do Pagamento</Label>
                    <select
                      id="status"
                      value={status}
                      onChange={handleStatusChange}
                      className="w-full rounded-md border border-gray-800 bg-black p-2"
                    >
                      <option value="paid">Pago (paid)</option>
                      <option value="approved">Aprovado (approved)</option>
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

                  {origin && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-gray-400">URL do Webhook (para configurar na Kiwify)</Label>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={copyWebhookUrl}>
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 break-all">{origin}/api/webhook/kiwify</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSubmitWebhook} className="w-full gradient-bg" disabled={isLoading}>
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
            </TabsContent>

            <TabsContent value="simples">
              <Card className="border-gray-800 bg-black/50 mb-8">
                <CardHeader>
                  <CardTitle>Webhook Simples</CardTitle>
                  <CardDescription>
                    Use esta opção simplificada que aceita apenas o e-mail do cliente e o status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailSimples" className="text-amber-400">
                      E-mail do Cliente (obrigatório)
                    </Label>
                    <Input
                      id="emailSimples"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="cliente@exemplo.com"
                      className="border-amber-800/50 focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusSimples">Status do Pagamento</Label>
                    <select
                      id="statusSimples"
                      value={status}
                      onChange={handleStatusChange}
                      className="w-full rounded-md border border-gray-800 bg-black p-2"
                    >
                      <option value="paid">Pago (paid)</option>
                      <option value="approved">Aprovado (approved)</option>
                      <option value="pending">Pendente</option>
                      <option value="refused">Recusado</option>
                      <option value="refunded">Reembolsado</option>
                    </select>
                  </div>

                  {origin && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs text-gray-400">
                          URL do Webhook Simples (para configurar na Kiwify)
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(`${origin}/api/webhook/simples`)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                        >
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 break-all">{origin}/api/webhook/simples</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSubmitSimples} className="w-full gradient-bg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar Webhook Simples"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>

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
