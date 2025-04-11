"use client"
import { decompressFromEncodedURIComponent } from "lz-string"
import { Heart, Music, QrCode } from "lucide-react"
import { FallingHearts } from "@/components/falling-hearts"
import { PhotoCarousel } from "@/components/photo-carousel"
import { QRCodeShare } from "@/components/qr-code-share"
import { useState, useEffect } from "react"

// Função para extrair o ID do vídeo do YouTube
const extractYoutubeVideoId = (url: string): string | null => {
  if (!url) return null

  // Padrões de URL do YouTube
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)

  return match && match[2].length === 11 ? match[2] : null
}

export default function PaginaDetalhesClient({
  pageId,
  pageData,
  searchParams,
}: { pageId: string; pageData: any; searchParams: { d?: string } }) {
  const compressedData = searchParams.d

  // Tentar decodificar os dados comprimidos da URL
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

  // Combinar dados do Supabase com dados da URL (priorizar dados do Supabase)
  const combinedData = {
    coupleNames: pageData.couple_names,
    date: pageData.date,
    time: pageData.time || "",
    message: pageData.message,
    youtubeLink: pageData.youtube_link || "",
    photoUrls: pageData.photo_urls || [],
    plan: pageData.plan || "basic",
    // Usar dados decodificados como fallback
    ...(decodedData && {
      coupleNames: decodedData.n || pageData.couple_names,
      date: decodedData.d || pageData.date,
      time: decodedData.t || pageData.time || "",
      message: decodedData.m || pageData.message,
      youtubeLink: decodedData.y || pageData.youtube_link || "",
      photoUrls: decodedData.p || pageData.photo_urls || [],
      plan: decodedData.pl || pageData.plan || "basic",
    }),
  }

  // Verificar se temos pelo menos uma foto válida
  const validPhotoUrls = combinedData.photoUrls.filter((url) => url)
  const hasValidPhoto = validPhotoUrls.length > 0

  // Verificar se estamos no plano premium e temos mais de uma foto
  const hasMultiplePhotos = combinedData.plan === "premium" && validPhotoUrls.length > 1

  // Extrair ID do vídeo do YouTube
  const youtubeVideoId = extractYoutubeVideoId(combinedData.youtubeLink)

  // URL atual para o QR Code
  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://amoremcodigo.com.br"}/pagina/${pageId}${compressedData ? `?d=${compressedData}` : ""}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-10">
      <div className="relative w-full max-w-md mx-auto">
        {/* Falling hearts */}
        <FallingHearts density="medium" contained={false} speed="normal" />

        <div className="bg-black/70 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-gray-800 mx-4">
          {/* Header */}
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-2 gradient-text">{combinedData.coupleNames}</h1>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <QrCode className="h-8 w-8 text-primary" />
                <Heart className="absolute -bottom-1 -right-1 h-4 w-4 text-pink-500" />
              </div>
            </div>
          </div>

          {/* Contador em tempo real */}
          <div className="px-6 mb-6">
            <RealtimeCounter startDate={`${combinedData.date}T${combinedData.time || "00:00:00"}`} />
          </div>

          {/* Foto com carrossel */}
          <div className="px-6 mb-6">
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-gray-800 relative">
              {hasValidPhoto ? (
                <PhotoCarousel photos={validPhotoUrls} interval={3000} />
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
                  __html: combinedData.message.replace(/\n/g, "<br>"),
                }}
              ></p>
            </div>
          </div>

          {/* YouTube (apenas para plano premium) */}
          {combinedData.plan === "premium" && youtubeVideoId && (
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

          {/* QR Code e opções de compartilhamento */}
          <div className="px-6 mb-6">
            <QRCodeShare url={currentUrl} coupleNames={combinedData.coupleNames} />
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

// Componente para o contador em tempo real
const RealtimeCounter = ({ startDate }: { startDate: string }) => {
  return (
    <div className="grid grid-cols-5 gap-2 text-center">
      <CounterDigit label="anos" startDate={startDate} unit="years" />
      <CounterDigit label="dias" startDate={startDate} unit="days" />
      <CounterDigit label="hrs" startDate={startDate} unit="hours" />
      <CounterDigit label="min" startDate={startDate} unit="minutes" />
      <CounterDigit label="seg" startDate={startDate} unit="seconds" animate={true} />
    </div>
  )
}

// Componente para cada dígito do contador
const CounterDigit = ({
  label,
  startDate,
  unit,
  animate = false,
}: {
  label: string
  startDate: string
  unit: "years" | "days" | "hours" | "minutes" | "seconds"
  animate?: boolean
}) => {
  return (
    <div className={`bg-gray-800/80 rounded-lg p-2 ${animate ? "animate-pulse" : ""}`}>
      <div className="text-xl font-bold">
        <TimeValue startDate={startDate} unit={unit} />
      </div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  )
}

// Componente para calcular e exibir o valor de tempo
const TimeValue = ({
  startDate,
  unit,
}: {
  startDate: string
  unit: "years" | "days" | "hours" | "minutes" | "seconds"
}) => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = new Date(startDate)

    const updateValue = () => {
      const now = new Date()
      const difference = now.getTime() - start.getTime()

      // Calcular o valor com base na unidade
      if (unit === "years") {
        setValue(Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25)))
      } else if (unit === "days") {
        const years = Math.floor(difference / (1000 * 60 * 60 * 24 * 365.25))
        const remainingAfterYears = difference - years * (1000 * 60 * 60 * 24 * 365.25)
        setValue(Math.floor(remainingAfterYears / (1000 * 60 * 60 * 24)))
      } else if (unit === "hours") {
        setValue(Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
      } else if (unit === "minutes") {
        setValue(Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)))
      } else if (unit === "seconds") {
        setValue(Math.floor((difference % (1000 * 60)) / 1000))
      }
    }

    updateValue()
    const interval = setInterval(updateValue, 1000)

    return () => clearInterval(interval)
  }, [startDate, unit])

  return <>{value}</>
}
