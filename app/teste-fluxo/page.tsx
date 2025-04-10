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

export default function TesteFluxoPage() {
  const [formData, setFormData] = useState({
    email: "teste@exemplo.com",
    coupleNames: "Casal Teste",
    date: "2023-01-01",
    time: "12:00",
    message: "Mensagem de teste para o casal",
    youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    photoUrls: ["https://picsum.photos/200/300"],
    plan: "premium",
    simulatePayment: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/test-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erro ao testar o fluxo")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsSubmitting(false)
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
              Teste de <span className="gradient-text">Fluxo Completo</span>
            </h1>
            <p className="mt-4 text-gray-400">
              Esta página permite testar o fluxo completo de criação de página e salvamento no Supabase.
            </p>
          </div>

          <Card className="border-gray-800 bg-black/50 mb-8">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Dados de Teste</CardTitle>
                <CardDescription>Preencha os dados para testar o fluxo completo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupleNames">Nome do Casal</Label>
                  <Input id="coupleNames" name="coupleNames" value={formData.coupleNames} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea id="message" name="message" value={formData.message} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtubeLink">Link do YouTube</Label>
                  <Input id="youtubeLink" name="youtubeLink" value={formData.youtubeLink} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoUrls">URL da Foto (uma por linha)</Label>
                  <Textarea
                    id="photoUrls"
                    name="photoUrls"
                    value={formData.photoUrls.join("\n")}
                    onChange={(e) =>
                      setFormData({ ...formData, photoUrls: e.target.value.split("\n").filter(Boolean) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Plano</Label>
                  <select
                    id="plan"
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-800 bg-black p-2"
                  >
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="simulatePayment"
                    name="simulatePayment"
                    checked={formData.simulatePayment}
                    onChange={(e) => setFormData({ ...formData, simulatePayment: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="simulatePayment">Simular confirmação de pagamento</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full gradient-bg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    "Testar Fluxo Completo"
                  )}
                </Button>
              </CardFooter>
            </form>
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
                <CardTitle className="text-green-500">Sucesso!</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-green-400">Mensagem:</h3>
                    <p className="text-gray-300">{result.message}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-green-400">ID da Página:</h3>
                    <p className="text-gray-300">{result.pageId}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-green-400">Dados Salvos:</h3>
                    <pre className="mt-2 rounded-md bg-gray-900 p-4 overflow-auto text-xs text-gray-300">
                      {JSON.stringify(result.savedPage, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
