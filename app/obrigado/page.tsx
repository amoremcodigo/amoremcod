"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Card, CardContent } from "@/components/ui/card"

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
      const response = await fetch(`/api/neonpay/check-payment?pageId=${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao verificar pagamento")
      }

      setPaymentStatus(data.status)
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
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
              Obrigado pela sua <span className="gradient-text">compra!</span>
            </h1>
          </div>

          <Card className="border-gray-800 bg-black/50 mb-8">
            <CardContent className="py-6">
              <div className="text-left space-y-4">
                <h3 className="text-xl font-bold text-primary text-center">Oiêee! 👋🏼👋🏼👋🏼 Tudo bem?</h3>

                <p>
                  Já realizou o pagamento e não encontrou o link da sua página… 😅 às vezes fica um pouco escondidinho
                  mesmo!!
                </p>

                <p className="font-bold">Vamos lá!</p>

                <p>Volte em SEU E-MAIL! 📧</p>

                <p>Dá uma conferida nestes lugares novamente, pfv: 😉</p>

                <ul className="list-disc pl-6 space-y-2">
                  <li>Caixa de entrada 📥</li>
                  <li>Caixa de spam ou *lixo eletrônico 🗑️</li>
                  <li>Pasta "Todos os e-mails" ✉️</li>
                </ul>

                <p className="font-bold">
                  ⚠️ IMPORTANTEEE: o e-mail com o link da sua página NÃOOO vem da Neon Pagamentos, tá? ⚠️
                </p>

                <p>Dica: pesquise 🔍 no seu E-MAIL a frase:</p>

                <div className="bg-gray-800/50 p-4 my-4 border-l-4 border-primary">
                  <p className="text-center font-bold">Sua página de declaração de amor está pronta!</p>
                </div>

                <p>Esse é o assunto do e-mail que você deve procurar.</p>

                <p>Use o campo de pesquisa 🔍 que tem em seu e-mail!!</p>

                <div className="bg-red-900/30 p-4 mt-6 border border-red-500/50 rounded-md">
                  <p className="text-center font-bold">🚨🚨🚨🚨 ATENÇÃO 🚨🚨🚨🚨</p>
                  <p className="text-center mt-2">
                    O LINK SEMPRE CHEGA AUTOMATICAMENTE, POR GENTILEZA PROCURE EM SEU E-MAIL NOVAMENTE 🙌🏼
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  )
}
