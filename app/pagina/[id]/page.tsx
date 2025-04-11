import { getPageById } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { decompressFromEncodedURIComponent } from "lz-string"
import { Heart, Music, QrCode } from "lucide-react"
import { FallingHearts } from "@/components/falling-hearts"

// Esta função é executada no servidor
export async function generateMetadata({ params }: { params: { id: string } }) {
  const pageId = params.id

  // Buscar dados da página no Supabase
  const pageData = await getPageById(pageId)

  if (!pageData) {
    return {
      title: "Página não encontrada | Amor em Código",
      description: "A página que você está procurando não existe ou foi removida.",
    }
  }

  return {
    title: `${pageData.couple_names} | Amor em Código`,
    description: `Página personalizada para ${pageData.couple_names}. Criada com Amor em Código.`,
  }
}

// Função para extrair o ID do vídeo do YouTube
const extractYoutubeVideoId = (url: string): string | null => {
  if (!url) return null

  // Padrões de URL do YouTube
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)

  return match && match[2].length === 11 ? match[2] : null
}

export default async function PaginaDetalhes({
  params,
  searchParams,
}: { params: { id: string }; searchParams: { d?: string } }) {
  const pageId = params.id
  const compressedData = searchParams.d

  // Buscar dados da página no Supabase
  const pageData = await getPageById(pageId)

  // Se a página não existir, redirecionar para a página inicial
  if (!pageData) {
    redirect("/")
  }

  // Verificar se o pagamento foi confirmado
  const isPaid = pageData.payment_status === "paid" || pageData.payment_status === "approved"

  // Se não estiver pago, mostrar página de pagamento pendente
  if (!isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-black/50 rounded-lg shadow-lg border border-gray-800">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <QrCode className="h-12 w-12 text-primary" />
                <Heart className="absolute -bottom-1 -right-1 h-6 w-6 text-pink-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold gradient-text">{pageData.couple_names}</h1>
            <p className="text-gray-400 mt-2">Página em processamento</p>
          </div>

          <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4 mb-6">
            <h2 className="text-amber-400 font-medium mb-2">Pagamento pendente</h2>
            <p className="text-gray-300 text-sm">
              Esta página está aguardando a confirmação do pagamento. Assim que o pagamento for confirmado, a página
              será ativada automaticamente.
            </p>
          </div>

          <p className="text-center text-gray-400 text-sm">
            Se você já realizou o pagamento, aguarde alguns instantes para a confirmação.
          </p>
        </div>
      </div>
    )
  }

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

  // Calcular o tempo de relacionamento
  const startDate = new Date(`${combinedData.date}T${combinedData.time || "00:00:00"}`)
  const now = new Date()
  const difference = now.getTime() - startDate.getTime()

  // Calcular anos, dias, horas, minutos e segundos
  const millisecondsInYear = 1000 * 60 * 60 * 24 * 365.25
  const years = Math.floor(difference / millisecondsInYear)
  const remainingAfterYears = difference - years * millisecondsInYear
  const days = Math.floor(remainingAfterYears / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remainingAfterYears % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remainingAfterYears % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remainingAfterYears % (1000 * 60)) / 1000)

  // Verificar se temos pelo menos uma foto válida
  const validPhotoUrls = combinedData.photoUrls.filter((url) => url)
  const hasValidPhoto = validPhotoUrls.length > 0

  // Verificar se estamos no plano premium e temos mais de uma foto
  const hasMultiplePhotos = combinedData.plan === "premium" && validPhotoUrls.length > 1

  // Extrair ID do vídeo do YouTube
  const youtubeVideoId = extractYoutubeVideoId(combinedData.youtubeLink)

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

          {/* Foto */}
          <div className="px-6 mb-6">
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-gray-800 relative">
              {hasValidPhoto ? (
                <img
                  src={validPhotoUrls[0] || "/placeholder.svg"}
                  alt={combinedData.coupleNames}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-500">Sem foto</p>
                </div>
              )}
            </div>
          </div>

          {/* Mais fotos (apenas para plano premium) */}
          {hasMultiplePhotos && (
            <div className="px-6 mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Mais fotos</h3>
              <div className="grid grid-cols-3 gap-2">
                {validPhotoUrls.slice(1).map((url, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`${combinedData.coupleNames} - Foto ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

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
