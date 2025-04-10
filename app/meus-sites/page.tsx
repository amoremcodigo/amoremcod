"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Laptop, Search, AlertCircle, ExternalLink, Calendar, Clock } from "lucide-react"
import Link from "next/link"

type SiteInfo = {
  id: string
  coupleNames: string
  date: string
  time?: string
  photoUrls: string[]
  plan: "basic" | "premium" | null
  createdAt?: number
}

export default function MeusSites() {
  const [email, setEmail] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [sites, setSites] = useState<SiteInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  // Função para buscar sites pelo e-mail
  const searchSites = () => {
    if (!email || !email.includes("@")) {
      setError("Por favor, insira um e-mail válido.")
      return
    }

    setIsSearching(true)
    setError(null)

    // Simular uma busca no banco de dados (usando localStorage)
    setTimeout(() => {
      try {
        const foundSites: SiteInfo[] = []
        const normalizedEmail = email.toLowerCase().trim()

        console.log("Buscando sites para o e-mail:", normalizedEmail)
        console.log("Total de itens no localStorage:", localStorage.length)

        // Percorrer todos os itens do localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)

          // Verificar se é uma chave de página
          if (key && key.startsWith("page_")) {
            try {
              const siteDataString = localStorage.getItem(key)
              if (!siteDataString) continue

              const siteData = JSON.parse(siteDataString)
              console.log(`Item ${key}:`, siteData)

              // Verificar se o e-mail corresponde (com normalização)
              const siteEmail = (siteData.email || "").toLowerCase().trim()
              console.log(`Comparando e-mails: "${siteEmail}" com "${normalizedEmail}"`)

              if (siteEmail === normalizedEmail) {
                console.log(`Correspondência encontrada para ${key}`)
                const id = key.replace("page_", "")

                // Adicionar à lista de sites encontrados
                foundSites.push({
                  id,
                  coupleNames: siteData.coupleNames || "Casal",
                  date: siteData.date || "",
                  time: siteData.time || "",
                  photoUrls: Array.isArray(siteData.photoUrls) ? siteData.photoUrls : [siteData.photoUrl || ""],
                  plan: siteData.plan || "basic",
                  createdAt: siteData.createdAt || Date.now(),
                })
              }
            } catch (e) {
              console.error("Erro ao processar item:", key, e)
            }
          }
        }

        console.log("Sites encontrados:", foundSites.length)

        // Ordenar por data de criação (mais recentes primeiro)
        foundSites.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

        setSites(foundSites)
        setSearchPerformed(true)
        setIsSearching(false)

        // Se não encontrou nenhum site, mostrar mensagem amigável
        if (foundSites.length === 0) {
          console.log("Nenhum site encontrado para o e-mail:", normalizedEmail)
        }
      } catch (e) {
        console.error("Erro ao buscar sites:", e)
        setError("Ocorreu um erro ao buscar seus sites. Por favor, tente novamente.")
        setIsSearching(false)
      }
    }, 1500) // Simular um delay de rede
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  // Função para criar um site de exemplo para testes
  const createExampleSite = () => {
    const id = Math.random().toString(36).substring(2, 8)
    const exampleData = {
      email: email.toLowerCase().trim(),
      coupleNames: "Maria & João",
      date: "2022-03-15",
      time: "14:30:00",
      message: "Exemplo de mensagem para teste",
      youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      photos: ["", "", "", "", ""],
      photoUrls: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        "",
        "",
        "",
        "",
      ],
      plan: "premium",
      createdAt: Date.now(),
    }

    localStorage.setItem(`page_${id}`, JSON.stringify(exampleData))
    console.log("Site de exemplo criado com ID:", id)
    console.log("Dados salvos:", exampleData)

    // Refazer a busca para mostrar o site criado
    searchSites()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Meus <span className="gradient-text">Sites</span>
            </h1>
            <p className="mt-4 text-gray-400">Acesse todas as páginas que você já criou com o Amor em Código.</p>
          </div>

          <Card className="border-gray-800 bg-black/50 mb-8">
            <CardHeader>
              <CardTitle>Encontre suas páginas</CardTitle>
              <CardDescription>Digite o e-mail que você utilizou para criar suas páginas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchSites()
                    }
                  }}
                />
                <Button onClick={searchSites} disabled={isSearching} className="gradient-bg">
                  {isSearching ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>

              {/* Botão para criar site de exemplo (apenas para testes) */}
              {process.env.NODE_ENV !== "production" && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={createExampleSite} className="text-xs">
                    Criar site de exemplo para teste
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {searchPerformed && !isSearching && (
            <>
              {sites.length > 0 ? (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">
                    {sites.length} {sites.length === 1 ? "página encontrada" : "páginas encontradas"}
                  </h2>

                  {sites.map((site) => (
                    <Card key={site.id} className="border-gray-800 bg-black/50 overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/3 h-40 bg-gray-800 relative">
                          {site.photoUrls[0] ? (
                            <img
                              src={site.photoUrls[0] || "/placeholder.svg"}
                              alt={site.coupleNames}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Laptop className="h-12 w-12 text-gray-600" />
                            </div>
                          )}
                          {site.plan === "premium" && (
                            <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                              Premium
                            </div>
                          )}
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-2">{site.coupleNames}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-4">
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-4 w-4" />
                                {formatDate(site.date)}
                              </div>
                              {site.time && (
                                <div className="flex items-center">
                                  <Clock className="mr-1 h-4 w-4" />
                                  {site.time}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Link href={`/pagina/${site.id}`} target="_blank">
                              <Button variant="outline" className="flex items-center gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Acessar Página
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                    <Laptop className="h-8 w-8 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Nenhuma página encontrada</h2>
                  <p className="text-gray-400 mb-6">Não encontramos nenhuma página criada com este e-mail.</p>
                  <Link href="/#formulario">
                    <Button className="gradient-bg">Criar Minha Primeira Página</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
