"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { decompressFromEncodedURIComponent } from "lz-string"
import { Music, Download, Printer, Edit, Save, X, ChevronLeft, ChevronRight, QrCode, Heart } from "lucide-react"
import { FallingHearts } from "@/components/falling-hearts"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CustomQRCode } from "@/components/custom-qr-code" // Import our new component

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
      const text = `${pageData.coupleNames} - Acesse nossa página personalizada: ${window.location.href}`
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    } catch (error) {
      console.error("Erro ao compartilhar via WhatsApp:", error)
    }
  }

  // Imprimir QR Code
  const printQrCode = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const html = `
      <html>
        <head>
          <title>QR Code - ${pageData?.coupleNames || "Amor em Código"}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .qr-container { position: relative; width: 300px; height: 300px; margin: 20px auto; }
            .qr-code { width: 100%; height: 100%; }
            .logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; }
            h2 { color: #9333EA; }
          </style>
        </head>
        <body>
          <h2>${pageData?.coupleNames || "Amor em Código"}</h2>
          <div class="qr-container">
            <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}&margin=1&qzone=1&format=png&bgcolor=FFFFFF&color=000000&ecc=H" alt="QR Code" />
            <img class="logo" src="${window.location.origin}/qr-heart-logo.svg" alt="Logo" />
          </div>
          <p>Escaneie este QR Code para acessar nossa página personalizada</p>
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  // Baixar QR Code
  const downloadQrCode = () => {
    // Criar um elemento canvas temporário
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const size = 500
    const logoSize = 100

    if (!ctx) {
      toast.error("Seu navegador não suporta esta funcionalidade")
      return
    }

    canvas.width = size
    canvas.height = size

    // Carregar o QR Code
    const qrImg = new Image()
    qrImg.crossOrigin = "anonymous"
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(window.location.href)}&margin=1&qzone=1&format=png&bgcolor=FFFFFF&color=000000&ecc=H`

    qrImg.onload = () => {
      // Desenhar o QR Code
      ctx.drawImage(qrImg, 0, 0, size, size)

      // Carregar e desenhar o logo
      const logoImg = new Image()
      logoImg.crossOrigin = "anonymous"
      logoImg.src = `${window.location.origin}/qr-heart-logo.svg`

      logoImg.onload = () => {
        // Desenhar o logo no centro
        ctx.drawImage(logoImg, size / 2 - logoSize / 2, size / 2 - logoSize / 2, logoSize, logoSize)

        // Converter para data URL e baixar
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = `qrcode-${pageData?.coupleNames || "amor-em-codigo"}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      logoImg.onerror = () => {
        toast.error("Erro ao carregar o logo")
        // Ainda assim, baixar o QR Code sem o logo
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = `qrcode-${pageData?.coupleNames || "amor-em-codigo"}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }

    qrImg.onerror = () => {
      toast.error("Erro ao gerar QR Code para download")
    }
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

  // Localizar a função handleShareWhatsApp e atualizar a mensagem
  const handleShareWhatsApp = () => {
    const message = "Abre esse QR Code, prometo que vale a pena! 😉🎁💫"
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + " " + window.location.href)}`
    window.open(whatsappUrl, "_blank")
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
  const youtubeWatchUrl = youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : null

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
                <QrCode className="h-6 w-6 text-primary" />
                <Heart className="absolute -bottom-1 -right-1 h-3 w-3 text-pink-500" />
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

          {youtubeWatchUrl && (
            <div className="px-6 mb-6 flex justify-center">
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <Music className="h-4 w-4 text-white" />
                <span>Ir para o YouTube</span>
              </a>
            </div>
          )}

          {/* QR Code options */}
          <div className="px-6 mb-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg p-3 flex flex-col gap-2 border border-gray-700/70 shadow-md">
              <h3 className="text-sm font-medium text-white mb-2 text-center">Compartilhar esta página</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center h-16 text-xs bg-gradient-to-br from-blue-900/30 to-blue-800/30 hover:from-blue-800/50 hover:to-blue-700/50 border-blue-700/50 text-white"
                  onClick={downloadQrCode}
                >
                  <Download className="h-5 w-5 mb-1 text-blue-400" />
                  Baixar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center h-16 text-xs bg-gradient-to-br from-purple-900/30 to-purple-800/30 hover:from-purple-800/50 hover:to-purple-700/50 border-purple-700/50 text-white"
                  onClick={printQrCode}
                >
                  <Printer className="h-5 w-5 mb-1 text-purple-400" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center justify-center h-16 text-xs bg-gradient-to-br from-green-900/30 to-green-800/30 hover:from-green-800/50 hover:to-green-700/50 border-green-700/50 text-white"
                  onClick={handleShareWhatsApp}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="#25D366"
                    stroke="currentColor"
                    strokeWidth="0"
                    className="h-5 w-5 mb-1"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5c-5.799 0-10.5-4.701-10.5-10.5S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5z" />
                  </svg>
                  <span>WhatsApp</span>
                </Button>
              </div>
              <div className="mt-2 text-center">
                {/* Use our custom QR code component with logo */}
                <CustomQRCode url={window.location.href} size={180} logoSize={40} className="inline-block" />
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
