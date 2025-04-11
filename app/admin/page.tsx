"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Laptop, Search, AlertCircle, ExternalLink, Calendar, Clock, Copy, Check, RefreshCw } from "lucide-react"
import Link from "next/link"

type SiteInfo = {
  id: string
  couple_names: string
  email: string
  date: string
  time?: string
  photo_urls: string[]
  plan: "basic" | "premium" | null
  payment_status: string
  page_url: string
  created_at?: string
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [sites, setSites] = useState<SiteInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [refreshing, setRefreshing] = useState(false)

  // Função para buscar todos os sites
  const fetchSites = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Buscar sites do Supabase
      const response = await fetch("/api/admin/list-sites")

      if (!response.ok) {
        throw new Error(`Erro ao buscar sites: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setSites(data.sites || [])
    } catch (e) {
      console.error("Erro ao buscar sites:", e)
      setError(e instanceof Error ? e.message : "Erro desconhecido ao buscar sites")

      // Tentar buscar do localStorage como fallback
      try {
        const localSites: SiteInfo[] = []

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)

          if (key && key.startsWith("page_")) {
            const siteData = JSON.parse(localStorage.getItem(key) || "{}")
            const id = key.replace("page_", "")

            localSites.push({
              id,
              couple_names: siteData.coupleNames || siteData.couple_names || "Casal",
              email: siteData.email || "",
              date: siteData.date || "",
              time: siteData.time || "",
              photo_urls: Array.isArray(siteData.photoUrls)
                ? siteData.photoUrls
                : Array.isArray(siteData.photo_urls)
                  ? siteData.photo_urls
                  : [],
              plan: siteData.plan || "basic",
              payment_status: siteData.payment_status || "pending",
              page_url: siteData.page_url || `${window.location.origin}/pagina/${id}`,
              created_at: siteData.created_at || new Date().toISOString(),
            })
          }
        }

        if (localSites.length > 0) {
          setSites(localSites)
          setError("Usando dados do armazenamento local (fallback)")
        }
      } catch (localError) {
        console.error("Erro ao buscar do armazenamento local:", localError)
      }
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // Carregar sites ao montar o componente
  useEffect(() => {
    fetchSites()
  }, [])

  // Função para atualizar a lista
  const refreshList = () => {
    setRefreshing(true)
    fetchSites()
  }

  // Função para copiar o link
  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied({ ...copied, [id]: true })
    setTimeout(() => {
      setCopied({ ...copied, [id]: false })
    }, 2000)
  }

  // Filtrar sites com base no termo de busca
  const filteredSites = sites.filter(
    (site) =>
      site.couple_names.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Ordenar por data de criação (mais recentes primeiro)
  const sortedSites = [...filteredSites].sort(
    (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime(),
  )

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Painel <span className="gradient-text">Administrativo</span>
            </h1>
            <p className="mt-4 text-gray-400">Gerencie todos os sites criados na plataforma.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar por nome, email ou ID..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={refreshList} variant="outline" className="whitespace-nowrap" disabled={refreshing}>
              {refreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar Lista
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  {sortedSites.length} {sortedSites.length === 1 ? "site encontrado" : "sites encontrados"}
                </h2>
              </div>

              <div className="space-y-4">
                {sortedSites.map((site) => (
                  <Card key={site.id} className="border-gray-800 bg-black/50 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-1/4 h-40 bg-gray-800 relative">
                        {site.photo_urls && site.photo_urls[0] ? (
                          <img
                            src={site.photo_urls[0] || "/placeholder.svg"}
                            alt={site.couple_names}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Laptop className="h-12 w-12 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${
                              site.payment_status === "paid" || site.payment_status === "approved"
                                ? "bg-green-500 text-white"
                                : "bg-amber-500 text-black"
                            }`}
                          >
                            {site.payment_status === "paid" || site.payment_status === "approved" ? "PAGO" : "PENDENTE"}
                          </div>
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${
                              site.plan === "premium" ? "bg-primary text-white" : "bg-gray-600 text-white"
                            }`}
                          >
                            {site.plan === "premium" ? "PREMIUM" : "BÁSICO"}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold mb-1">{site.couple_names}</h3>
                            <span className="text-xs text-gray-400">ID: {site.id}</span>
                          </div>

                          <p className="text-sm text-gray-400 mb-2">{site.email}</p>

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
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              Criado: {formatDate(site.created_at || "")}
                            </div>
                          </div>

                          <div className="flex items-center bg-gray-800/50 rounded p-2 mb-4">
                            <p className="text-sm text-gray-300 truncate flex-1">{site.page_url}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 h-8 w-8 p-0"
                              onClick={() => copyLink(site.page_url, site.id)}
                            >
                              {copied[site.id] ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Link href={`/pagina/${site.id}`} target="_blank">
                            <Button variant="outline" className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Visualizar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {sortedSites.length === 0 && (
                  <div className="text-center py-12 bg-black/30 rounded-lg border border-gray-800">
                    <Laptop className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">Nenhum site encontrado</h3>
                    <p className="text-gray-400">Não foram encontrados sites com os critérios de busca atuais.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
