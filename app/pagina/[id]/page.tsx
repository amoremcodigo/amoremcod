"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { decompressFromEncodedURIComponent } from "lz-string"
import { Heart, Music, QrCode, Download, Printer, Phone, Edit, Save, X, ChevronLeft, ChevronRight } from "lucide-react"
import { FallingHearts } from "@/components/falling-hearts"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

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
  const [editingMessage, setEditingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [savingMessage, setSavingMessage] = useState(false)
  const [youtubePlayerActive, setYoutubePlayerActive] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
        setNewMessage(combinedData.message || "")
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

  // Focar no textarea quando entrar no modo de edição
  useEffect(() => {
    if (editingMessage && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editingMessage])

  // Compartilhar via WhatsApp
  const shareViaWhatsApp = async () => {
    try {
      // Gerar URL do QR Code com alta qualidade
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}&margin=10&qzone=2&format=png`

      // Verificar se a API Web Share está disponível
      if (navigator.share) {
        // Buscar a imagem e convertê-la para blob
        const response = await fetch(qrCodeUrl)
        const blob = await response.blob()

        // Criar um arquivo a partir do blob
        const file = new File([blob], "qrcode.png", { type: "image/png" })

        // Compartilhar o arquivo
        await navigator.share({
          title: `${pageData.coupleNames} - Amor em Código`,
          text: "Escaneie este QR Code para acessar nossa página personalizada",
          files: [file],
        })
      } else {
        // Fallback para dispositivos que não suportam Web Share API
        const text = `${pageData.coupleNames} - Escaneie este QR Code para acessar nossa página personalizada: ${window.location.href}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
      }
    } catch (error) {
      console.error("Erro ao compartilhar via WhatsApp:", error)
      // Fallback em caso de erro
      const text = `${pageData.coupleNames} - Acesse nossa página personalizada: ${window.location.href}`
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    }
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
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.href)}&margin=10&qzone=2&format=png" alt="QR Code" />
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
    // Usar parâmetros para melhorar a qualidade
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.href)}&margin=10&qzone=2&format=png`
    link.download = `qrcode-${pageData?.coupleNames || "amor-em-codigo"}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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

  // Ativar o player do YouTube
  const activateYoutubePlayer = () => {
    setYoutubePlayerActive(true)
  }

  // Salvar mensagem atualizada
  const saveMessage = async () => {
    if (!pageData || !newMessage.trim()) return

    setSavingMessage(true)

    try {
      // Atualizar no localStorage primeiro (como backup)
      try {
        const storedData = localStorage.getItem(`page_${pageId}`)
        if (storedData) {
          const localData = JSON.parse(storedData)
          localData.message = newMessage
          localStorage.setItem(`page_${pageId}`, JSON.stringify(localData))
        }
      } catch (error) {
        console.error("Erro ao atualizar mensagem no localStorage:", error)
      }

      // Atualizar no Supabase via API
      const response = await fetch(`/api/pages/${pageId}/update-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: newMessage }),
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar mensagem")
      }

      // Atualizar o estado local
      setPageData({
        ...pageData,
        message: newMessage,
      })

      setEditingMessage(false)
      toast.success("Mensagem atualizada com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error)
      toast.error("Erro ao atualizar mensagem. Tente novamente.")
    } finally {
      setSavingMessage(false)
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
              <div className="relative">
                <QrCode className="h-8 w-8 text-primary" />
                <Heart className="absolute -bottom-1 -right-1 h-4 w-4 text-pink-500" />
              </div>
            </div>
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

          {/* Botão de edição da mensagem (fora do box da mensagem) */}
          <div className="px-6 mb-6 flex justify-center">
            <Button
              onClick={() => setEditingMessage(true)}
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              disabled={editingMessage}
            >
              <Edit className="h-4 w-4" />
              Editar Mensagem
            </Button>
          </div>

          {/* Área de edição da mensagem (aparece quando editingMessage é true) */}
          {editingMessage && (
            <div className="px-6 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[120px] bg-gray-900 border-gray-700 text-white resize-none mb-3"
                  placeholder="Escreva sua mensagem aqui..."
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMessage(false)
                      setNewMessage(pageData.message)
                    }}
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveMessage}
                    disabled={savingMessage || !newMessage.trim()}
                    className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {savingMessage ? (
                      <>
                        <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* YouTube (apenas para plano premium) */}
          {pageData.plan === "premium" && youtubeVideoId && (
            <div className="px-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Music className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Nossa música</span>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden relative">
                {!youtubePlayerActive ? (
                  // Thumbnail com botão de play
                  <div className="w-full h-full cursor-pointer relative" onClick={activateYoutubePlayer}>
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
                ) : (
                  // iFrame do YouTube
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&showinfo=0`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="border-0"
                  ></iframe>
                )}
              </div>
            </div>
          )}

          {/* QR Code options */}
          <div className="px-6 mb-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 flex flex-col gap-3 border border-gray-700 shadow-lg">
              <h3 className="text-sm font-medium text-white mb-2 text-center">Compartilhar esta página</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center h-20 text-xs bg-gradient-to-br from-blue-900/50 to-blue-800/50 hover:from-blue-800 hover:to-blue-700 border-blue-700 text-white"
                  onClick={downloadQrCode}
                >
                  <Download className="h-6 w-6 mb-1 text-blue-400" />
                  Baixar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center h-20 text-xs bg-gradient-to-br from-purple-900/50 to-purple-800/50 hover:from-purple-800 hover:to-purple-700 border-purple-700 text-white"
                  onClick={printQrCode}
                >
                  <Printer className="h-6 w-6 mb-1 text-purple-400" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center h-20 text-xs bg-gradient-to-br from-green-900/50 to-green-800/50 hover:from-green-800 hover:to-green-700 border-green-700 text-white"
                  onClick={shareViaWhatsApp}
                >
                  <Phone className="h-6 w-6 mb-1 text-green-400" />
                  WhatsApp
                </Button>
              </div>
              <div className="mt-2 text-center bg-white p-1 rounded-lg shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}&margin=10&qzone=2&format=png`}
                  alt="QR Code"
                  className="inline-block max-w-[180px] rounded-lg"
                />
              </div>
            </div>
          </div>

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
