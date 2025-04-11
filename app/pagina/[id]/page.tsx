"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { decompressFromEncodedURIComponent } from "lz-string"
import { Heart, Music, QrCode, Download, Printer, Phone } from "lucide-react"
import { FallingHearts } from "@/components/falling-hearts"
import { Button } from "@/components/ui/button"

// Função para extrair o ID do vídeo do YouTube
const extractYoutubeVideoId = (url: string): string | null => {
  if (!url) return null

  // Padrões de URL do YouTube
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)

  return match && match[2].length === 11 ? match[2] : null
}

export default function PaginaDetalhes() {
  const params = useParams()
  const searchParams = useSearchParams()
  const pageId = params.id as string
  const compressedData = searchParams.get("d")

  const [pageData, setPageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [years, setYears] = useState(0)
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [showQrOptions, setShowQrOptions] = useState(false)

  // Buscar dados da página
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        // Primeiro, tentar decodificar os dados da URL
        let decodedData: any = null
        if (compressedData) {
          try {
            const jsonString = decompressFromEncodedURIComponent(compressedData)
            if (jsonString) {
              decodedData = JSON.parse(jsonString)
            }
          } catch (error) {
            console.error("Erro ao decodificar dados da URL:", error)
          }
        }

        // Tentar buscar do localStorage
        let localData = null
        try {
          const storedData = localStorage.getItem(`page_${pageId}`)
          if (storedData) {
            localData = JSON.parse(storedData)
          }
        } catch (error) {
          console.error("Erro ao buscar dados do localStorage:", error)
        }

        // Tentar buscar do Supabase via API
        let supabaseData = null
        try {
          const response = await fetch(`/api/pages/${pageId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.page) {
              supabaseData = data.page
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do Supabase:", error)
        }

        // Combinar os dados, priorizando Supabase > localStorage > URL
        const combinedData = {
          // Dados da URL (menor prioridade)
          ...(decodedData && {
            coupleNames: decodedData.n,
            date: decodedData.d,
            time: decodedData.t || "",
            message: decodedData.m,
            youtubeLink: decodedData.y || "",
            photoUrls: decodedData.p || [],
            plan: decodedData.pl || "basic",
          }),

          // Dados do localStorage
          ...(localData && {
            coupleNames: localData.coupleNames || localData.couple_names,
            date: localData.date,
            time: localData.time || "",
            message: localData.message,
            youtubeLink: localData.youtubeLink || localData.youtube_link || "",
            photoUrls: localData.photoUrls || localData.photo_urls || [],
            plan: localData.plan,
            paymentStatus: localData.payment_status || "pending",
          }),

          // Dados do Supabase (maior prioridade)
          ...(supabaseData && {
            coupleNames: supabaseData.couple_names,
            date: supabaseData.date,
            time: supabaseData.time || "",
            message: supabaseData.message,
            youtubeLink: supabaseData.youtube_link || "",
            photoUrls: supabaseData.photo_urls || [],
            plan: supabaseData.plan || "basic",
            paymentStatus: supabaseData.payment_status,
          }),
        }

        setPageData(combinedData)
      } catch (error) {
        console.error("Erro ao buscar dados da página:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPageData()
  }, [pageId, compressedData])

  // Efeito para alternar automaticamente as fotos no carrossel
  useEffect(() => {
    if (!pageData) return

    const validPhotos = pageData.photoUrls?.filter((url: string) => url) || []
    if (validPhotos.length <= 1) return

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % validPhotos.length)
    }, 3000) // Trocar a cada 3 segundos

    return () => clearInterval(interval)
  }, [pageData])

  // Atualizar o contador em tempo real
  useEffect(() => {
    if (!pageData) return

    const startDate = new Date(`${pageData.date}T${pageData.time || "00:00:00"}`)

    const updateCounter = () => {
      const now = new Date()
      const difference = now.getTime() - startDate.getTime()

      // Calcular anos, dias, horas, minutos e segundos
      const millisecondsInYear = 1000 * 60 * 60 * 24 * 365.25
      const y = Math.floor(difference / millisecondsInYear)
      const remainingAfterYears = difference - y * millisecondsInYear
      const d = Math.floor(remainingAfterYears / (1000 * 60 * 60 * 24))
      const h = Math.floor((remainingAfterYears % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const m = Math.floor((remainingAfterYears % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((remainingAfterYears % (1000 * 60)) / 1000)

      setYears(y)
      setDays(d)
      setHours(h)
      setMinutes(m)
      setSeconds(s)
    }

    // Atualizar imediatamente e depois a cada segundo
    updateCounter()
    const interval = setInterval(updateCounter, 1000)

    return () => clearInterval(interval)
  }, [pageData])

  // Compartilhar via WhatsApp
  const shareViaWhatsApp = () => {
    const text = `Veja nossa página personalizada: ${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  // Imprimir QR Code
  const printQrCode = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${pageData?.coupleNames || "Amor em Código"}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              img { max-width: 300px; margin: 20px auto; }
              h2 { color: #9333EA; }
            </style>
          </head>
          <body>
            <h2>${pageData?.coupleNames || "Amor em Código"}</h2>
            <div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}" alt="QR Code" />
            </div>
            <p>Escaneie este QR Code para acessar nossa página personalizada</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  // Baixar QR Code
  const downloadQrCode = () => {
    const link = document.createElement("a")
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`
    link.download = `qrcode-${pageData?.coupleNames || "amor-em-codigo"}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-black/50 rounded-lg shadow-lg border border-gray-800 text-center">
          <h1 className="text-2xl font-bold mb-4">Página não encontrada</h1>
          <p className="text-gray-400">A página que você está procurando não existe ou foi removida.</p>
        </div>
      </div>
    )
  }

  // Verificar se temos pelo menos uma foto válida
  const validPhotoUrls = pageData.photoUrls?.filter((url: string) => url) || []
  const hasValidPhoto = validPhotoUrls.length > 0
  const hasMultiplePhotos = validPhotoUrls.length > 1

  // Extrair ID do vídeo do YouTube
  const youtubeVideoId = extractYoutubeVideoId(pageData.youtubeLink)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-10">
      <div className="relative w-full max-w-md mx-auto">
        {/* Falling hearts */}
        <FallingHearts density="medium" contained={false} speed="normal" />

        <div className="bg-black/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-gray-800 mx-4">
          {/* Header */}
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-2 gradient-text">{pageData.coupleNames}</h1>
            <div className="flex justify-center mb-4">
              <div className="relative cursor-pointer" onClick={() => setShowQrOptions(!showQrOptions)}>
                <QrCode className="h-8 w-8 text-primary" />
                <Heart className="absolute -bottom-1 -right-1 h-4 w-4 text-pink-500" />
              </div>
            </div>

            {/* QR Code options */}
            {showQrOptions && (
              <div className="bg-gray-800 rounded-lg p-4 mb-4 flex flex-col gap-3">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Compartilhar esta página</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center justify-center h-16 text-xs"
                    onClick={downloadQrCode}
                  >
                    <Download className="h-5 w-5 mb-1" />
                    Baixar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center justify-center h-16 text-xs"
                    onClick={printQrCode}
                  >
                    <Printer className="h-5 w-5 mb-1" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center justify-center h-16 text-xs"
                    onClick={shareViaWhatsApp}
                  >
                    <Phone className="h-5 w-5 mb-1" />
                    WhatsApp
                  </Button>
                </div>
                <div className="mt-2 text-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
                    alt="QR Code"
                    className="inline-block max-w-[150px] rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contador */}
          <div className="px-6 mb-6">
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="bg-gray-800/80 rounded-lg p-2">
                <div className="text-xl font-bold">{years}</div>
                <div className="text-xs text-gray-400">anos</div>
              </div>
              <div className="bg-gray-800/80 rounded-lg p-2">
                <div className="text-xl font-bold">{days}</div>
                <div className="text-xs text-gray-400">dias</div>
              </div>
              <div className="bg-gray-800/80 rounded-lg p-2">
                <div className="text-xl font-bold">{hours}</div>
                <div className="text-xs text-gray-400">hrs</div>
              </div>
              <div className="bg-gray-800/80 rounded-lg p-2">
                <div className="text-xl font-bold">{minutes}</div>
                <div className="text-xs text-gray-400">min</div>
              </div>
              <div className="bg-gray-800/80 rounded-lg p-2 animate-pulse">
                <div className="text-xl font-bold">{seconds}</div>
                <div className="text-xs text-gray-400">seg</div>
              </div>
            </div>
          </div>

          {/* Foto com carrossel */}
          <div className="px-6 mb-6">
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-gray-800 relative">
              {hasValidPhoto ? (
                <div className="relative w-full h-full">
                  {/* Mostrar a foto atual */}
                  {validPhotoUrls.map((url: string, index: number) => (
                    <div
                      key={index}
                      className="absolute inset-0 w-full h-full transition-opacity duration-1000"
                      style={{
                        opacity: index === currentPhotoIndex ? 1 : 0,
                        zIndex: index === currentPhotoIndex ? 10 : 0,
                      }}
                    >
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}

                  {/* Indicadores de foto (apenas se houver múltiplas fotos) */}
                  {hasMultiplePhotos && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
                      {validPhotoUrls.map((_: string, index: number) => (
                        <div
                          key={index}
                          className={`h-1.5 rounded-full ${index === currentPhotoIndex ? "w-3 bg-white" : "w-1.5 bg-white/50"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-500">Sem foto</p>
                </div>
              )}
            </div>
          </div>

          {/* Mensagem */}
          <div className="px-6 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <p
                className="text-gray-300"
                dangerouslySetInnerHTML={{
                  __html: pageData.message.replace(/\n/g, "<br>"),
                }}
              ></p>
            </div>
          </div>

          {/* YouTube (apenas para plano premium) */}
          {pageData.plan === "premium" && youtubeVideoId && (
            <div className="px-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Music className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Nossa música</span>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="border-0"
                ></iframe>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 text-center border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Criado com ❤️ por <span className="gradient-text font-medium">Amor em Código</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
