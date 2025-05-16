"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { decompressFromEncodedURIComponent } from "lz-string"
import { FallingHearts } from "@/components/falling-hearts"
import { Button } from "@/components/ui/button"
import { Music, Heart, QrCode, ChevronLeft, ChevronRight } from "lucide-react"
import { Footer } from "@/components/footer"
import { CustomQRCode } from "@/components/custom-qr-code"

// Função para extrair o ID do vídeo do YouTube
const extractYoutubeVideoId = (url: string): string | null => {
  if (!url) return null

  // Padrões de URL do YouTube
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)

  return match && match[2].length === 11 ? match[2] : null
}

export default function VisualizacaoTemporaria() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const compressedData = searchParams.get("d")
  const checkoutUrl = searchParams.get("checkout")
  const pageId = searchParams.get("id")

  const [pageData, setPageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [years, setYears] = useState(0)
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  // Carregar dados da página
  useEffect(() => {
    if (!compressedData) {
      setLoading(false)
      return
    }

    try {
      const jsonString = decompressFromEncodedURIComponent(compressedData)
      if (jsonString) {
        const decodedData = JSON.parse(jsonString)

        // Mapear os dados decodificados para o formato esperado
        const formattedData = {
          coupleNames: decodedData.n,
          date: decodedData.d,
          time: decodedData.t || "",
          message: decodedData.m,
          youtubeLink: decodedData.y || "",
          photoUrls: decodedData.p || [],
          plan: decodedData.pl || "basic",
        }

        setPageData(formattedData)
      }
    } catch (error) {
      console.error("Erro ao decodificar dados da URL:", error)
    } finally {
      setLoading(false)
    }
  }, [compressedData])

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

  // Navegar para a foto anterior
  const prevPhoto = () => {
    const validPhotos = pageData.photoUrls?.filter((url: string) => url) || []
    if (validPhotos.length <= 1) return

    setCurrentPhotoIndex((prevIndex) => (prevIndex === 0 ? validPhotos.length - 1 : prevIndex - 1))
  }

  // Navegar para a próxima foto
  const nextPhoto = () => {
    const validPhotos = pageData.photoUrls?.filter((url: string) => url) || []
    if (validPhotos.length <= 1) return

    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % validPhotos.length)
  }

  // Redirecionar para o checkout
  const redirectToCheckout = () => {
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    }
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
  const youtubeEmbedUrl = youtubeVideoId ? `https://www.youtube.com/embed/${youtubeVideoId}` : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex flex-col">
      <div className="flex-grow flex items-center justify-center py-10">
        <div className="relative w-full max-w-md mx-auto">
          {/* Falling hearts */}
          <FallingHearts density="medium" contained={false} speed="normal" />

          <div className="bg-black/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-gray-800 mx-4">
            {/* Header */}
            <div className="p-6 text-center">
              <h1 className="text-2xl font-bold mb-2 gradient-text">{pageData.coupleNames}</h1>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <QrCode className="h-8 w-8 text-primary" />
                  <Heart className="absolute -bottom-1 -right-1 h-4 w-4 text-pink-500" />
                </div>
              </div>
            </div>

            {/* Contador */}
            <div className="px-6 mb-6">
              <p className="text-center text-sm mb-2 text-gray-300">Juntos há</p>
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
                          onError={(e) => {
                            // Fallback para placeholder se a imagem falhar
                            console.error(`Erro ao carregar imagem ${index}:`, url)
                            ;(e.target as HTMLImageElement).src =
                              `/placeholder.svg?height=800&width=600&query=couple photo ${index + 1}`
                          }}
                        />
                      </div>
                    ))}

                    {/* Botões de navegação */}
                    {hasMultiplePhotos && (
                      <>
                        <button
                          onClick={prevPhoto}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 text-white z-20 transition-colors"
                          aria-label="Foto anterior"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={nextPhoto}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 text-white z-20 transition-colors"
                          aria-label="Próxima foto"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      </>
                    )}

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
            <div className="px-6 mb-3">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <p
                  className="text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: pageData.message.replace(/\n/g, "<br>"),
                  }}
                ></p>
              </div>
            </div>

            {/* QR Code da página */}
            <div className="px-6 mb-6">
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center">
                  <span className="text-sm text-gray-400">QR Code da página</span>
                </div>
                <div className="bg-white p-3 rounded-lg inline-block">
                  <CustomQRCode
                    url={`${window.location.origin}/pagina/${pageId || "preview"}`}
                    size={200}
                    logoSize={40}
                  />
                </div>
              </div>
            </div>

            {/* YouTube (apenas para plano premium) */}
            {pageData.plan === "premium" && youtubeVideoId && (
              <div className="px-6 mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Music className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Nossa música</span>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden relative">
                  {/* Thumbnail com botão de play */}
                  <div className="w-full h-full cursor-pointer relative">
                    <img
                      src={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
                      alt="Thumbnail do vídeo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback para thumbnail de menor qualidade
                        const target = e.target as HTMLImageElement
                        target.src = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center hover:bg-black/30 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors">
                        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Caixa flutuante posicionada para cobrir parcialmente o QR Code */}
          <div className="absolute inset-0 flex items-end justify-center pb-32 z-50">
            <div className="bg-black/90 backdrop-blur-md border border-purple-500 rounded-xl p-6 max-w-xs mx-4 shadow-2xl">
              <div className="text-center">
                <div className="mb-2">
                  <div className="relative inline-block">
                    <QrCode className="h-12 w-12 text-primary" />
                    <Heart className="absolute -bottom-1 -right-1 h-6 w-6 text-pink-500" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-3 gradient-text">
                  Sua página personalizada com QR Code já foi criada!
                </h2>
                <p className="text-gray-300 mb-4">Libere o acesso completo automaticamente ao finalizar o pagamento.</p>
                <Button
                  onClick={redirectToCheckout}
                  className="w-full gradient-bg text-white font-medium py-2 px-4 rounded-md"
                >
                  Finalizar pagamento
                </Button>
              </div>
            </div>
          </div>

          {/* Segunda caixa flutuante posicionada para cobrir parcialmente as fotos (mais acima) */}
          <div className="absolute inset-0 flex items-center justify-center mt-[-100px] z-50">
            <div className="bg-black/90 backdrop-blur-md border border-purple-500 rounded-xl p-6 max-w-xs mx-4 shadow-2xl">
              <div className="text-center">
                <div className="mb-2">
                  <div className="relative inline-block">
                    <QrCode className="h-12 w-12 text-primary" />
                    <Heart className="absolute -bottom-1 -right-1 h-6 w-6 text-pink-500" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-3 gradient-text">
                  Sua página personalizada com QR Code já foi criada!
                </h2>
                <p className="text-gray-300 mb-4">Libere o acesso completo automaticamente ao finalizar o pagamento.</p>
                <Button
                  onClick={redirectToCheckout}
                  className="w-full gradient-bg text-white font-medium py-2 px-4 rounded-md"
                >
                  Finalizar pagamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
