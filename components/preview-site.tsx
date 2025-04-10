"use client"

import { useState, useEffect } from "react"
import { Music, Heart, QrCode, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFormContext } from "@/context/form-context"
import { FallingHearts } from "@/components/falling-hearts"

export function PreviewSite() {
  const { formData, isFormValid, submitForm, isSubmitting } = useFormContext()
  const [years, setYears] = useState(0)
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Usar a data do formulário ou uma data padrão
  const startDate = formData.date
    ? new Date(`${formData.date}T${formData.time || "00:00:00"}`)
    : new Date(new Date().setFullYear(new Date().getFullYear() - 2))

  // Filtrar fotos válidas (não vazias) - CORRIGIDO para considerar ambos os tipos de fotos
  const validPhotos = formData.photos
    .filter((photo) => photo && (photo.startsWith("data:image") || photo.startsWith("http")))
    .map((photo, index) => photo || formData.photoUrls[index] || "")
    .filter((photo) => photo)

  // Verificar se temos pelo menos uma foto válida
  const hasValidPhoto = validPhotos.length > 0

  // Verificar se estamos no plano premium e temos mais de uma foto
  const hasCarousel = formData.plan === "premium" && validPhotos.length > 1

  // Log para depuração
  useEffect(() => {
    console.log("Preview - Fotos válidas:", validPhotos.length)
    console.log("Preview - Fotos no formData:", formData.photos.filter((p) => p).length)
  }, [validPhotos.length, formData.photos])

  // Atualizar o contador em tempo real
  useEffect(() => {
    const updateCounter = () => {
      const now = new Date()
      const difference = now.getTime() - startDate.getTime()

      // Calcular anos (aproximado, não considera anos bissextos precisamente)
      const millisecondsInYear = 1000 * 60 * 60 * 24 * 365.25
      const y = Math.floor(difference / millisecondsInYear)

      // Calcular o restante após subtrair os anos
      const remainingAfterYears = difference - y * millisecondsInYear

      // Calcular dias, horas, minutos e segundos a partir do restante
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
  }, [startDate])

  // Efeito para alternar automaticamente as fotos no carrossel
  useEffect(() => {
    if (!hasCarousel) return

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % validPhotos.length)
    }, 2000) // Trocar a cada 2 segundos

    return () => clearInterval(interval)
  }, [hasCarousel, validPhotos.length])

  // Função para extrair o ID do vídeo do YouTube
  const extractYoutubeVideoId = (url: string): string | null => {
    if (!url) return null

    // Padrões de URL do YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11 ? match[2] : null
  }

  // Função para obter a URL da thumbnail do YouTube
  const getYoutubeThumbnailUrl = (url: string) => {
    if (!url) return ""

    // Extrair o ID do vídeo
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = match && match[2].length === 11 ? match[2] : null

    if (!videoId) return ""

    // Usar a thumbnail de máxima resolução para melhor qualidade
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  }

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return ""

    // Padrões de URL do YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : ""
  }

  const youtubeEmbedUrl = getYoutubeEmbedUrl(formData.youtubeLink)

  // Função para navegar para a foto anterior
  const prevPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => (prevIndex === 0 ? validPhotos.length - 1 : prevIndex - 1))
  }

  // Função para navegar para a próxima foto
  const nextPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % validPhotos.length)
  }

  const handleSubmit = async () => {
    if (!isFormValid() || isSubmitting) return

    try {
      await submitForm()
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Ocorreu um erro ao criar sua página. Por favor, tente novamente.")
    }
  }

  return (
    <section className="w-full py-16 md:py-20 bg-black/30" id="preview">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Veja como ficará sua <span className="gradient-text">página personalizada</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Prévia de como sua página ficará após a personalização.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="relative mx-auto max-w-[320px]">
              <div className="overflow-hidden rounded-[40px] border-[8px] border-gray-800 bg-gray-800 shadow-xl relative">
                <div className="relative">
                  <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 z-20 flex items-center justify-center">
                    <div className="w-20 h-1 rounded-full bg-gray-700" />
                  </div>

                  {/* Phone screen content with falling hearts */}
                  <div className="pt-6 pb-2 px-2 bg-gray-900 relative">
                    {/* Falling hearts contained within the phone screen - com velocidade aumentada */}
                    <div className="absolute inset-0 overflow-hidden z-20">
                      <FallingHearts density="medium" contained={true} speed="fast" />
                    </div>

                    {/* Adicionando espaço extra no topo para mover o nome para baixo */}
                    <div className="pt-4 relative z-10"></div>

                    {/* Header with logo - similar to personalized page */}
                    <h1 className="text-lg font-bold mb-2 gradient-text relative z-10 text-center mt-4">
                      {formData.coupleNames || "Maria & João"}
                    </h1>
                    <div className="flex justify-center mb-4 relative z-10">
                      <div className="relative">
                        <QrCode className="h-6 w-6 text-primary" />
                        <Heart className="absolute -bottom-1 -right-1 h-3 w-3 text-pink-500" />
                      </div>
                    </div>

                    {/* Contador */}
                    <div className="mb-4 relative z-10">
                      <div className="grid grid-cols-5 gap-1 text-center">
                        <div className="bg-gray-800 rounded-lg p-1">
                          <div className="text-lg font-bold">{years}</div>
                          <div className="text-xs text-gray-400">anos</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-1">
                          <div className="text-lg font-bold">{days}</div>
                          <div className="text-xs text-gray-400">dias</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-1">
                          <div className="text-lg font-bold">{hours}</div>
                          <div className="text-xs text-gray-400">hrs</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-1">
                          <div className="text-lg font-bold">{minutes}</div>
                          <div className="text-xs text-gray-400">min</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-1 animate-pulse">
                          <div className="text-lg font-bold">{seconds}</div>
                          <div className="text-xs text-gray-400">seg</div>
                        </div>
                      </div>
                    </div>

                    {/* Foto com carrossel para plano premium */}
                    <div className="aspect-[4/5] rounded-lg overflow-hidden mb-4 bg-gray-800 relative z-10">
                      {hasValidPhoto ? (
                        <div className="relative w-full h-full">
                          {/* Mostrar a foto atual */}
                          <img
                            src={formData.plan === "premium" ? validPhotos[currentPhotoIndex] : validPhotos[0]}
                            alt="Casal"
                            className="object-cover w-full h-full"
                          />

                          {/* Controles do carrossel - apenas para plano premium com múltiplas fotos */}
                          {hasCarousel && (
                            <>
                              <button
                                onClick={prevPhoto}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 text-white z-10"
                                aria-label="Foto anterior"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                onClick={nextPhoto}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1 text-white z-10"
                                aria-label="Próxima foto"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>

                              {/* Indicadores de foto */}
                              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                                {validPhotos.map((_, index) => (
                                  <div
                                    key={index}
                                    className={`h-1.5 rounded-full ${index === currentPhotoIndex ? "w-3 bg-white" : "w-1.5 bg-white/50"}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-gray-500 text-sm">Adicione uma foto do casal</p>
                        </div>
                      )}
                    </div>

                    {/* Mensagem */}
                    <div className="p-3 text-center text-xs mb-4 relative z-10">
                      <p
                        className="text-gray-300"
                        dangerouslySetInnerHTML={{
                          __html: (
                            formData.message ||
                            "Amor, cada momento ao seu lado é um presente. Você ilumina meus dias, transforma minha vida e faz meu coração transbordar de felicidade. Te amar é a melhor parte da minha vida! ❤️"
                          ).replace(/\n/g, "<br>"),
                        }}
                      ></p>
                    </div>

                    {/* YouTube - apenas mostrar se for plano premium ou se não tiver plano selecionado */}
                    {(formData.plan === "premium" || !formData.plan) && (
                      <div className="mb-4 relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Music className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-400">Nossa música</span>
                        </div>
                        <div className="rounded-lg overflow-hidden bg-gray-800 aspect-video flex items-center justify-center">
                          {youtubeEmbedUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={getYoutubeThumbnailUrl(formData.youtubeLink) || "/placeholder.svg"}
                                alt="Thumbnail do vídeo"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback para thumbnail de menor qualidade se a de alta qualidade falhar
                                  const target = e.target as HTMLImageElement
                                  const videoId = extractYoutubeVideoId(formData.youtubeLink)
                                  if (videoId && target.src.includes("maxresdefault")) {
                                    target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-2">
                              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                              </div>
                              <p className="text-xs text-gray-400">Vídeo do YouTube</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-center text-gray-500 pb-2 relative z-10">
                      Criado com ❤️ por Amor em Código
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12">
          {/* Verificar e garantir que o botão "Finalizar Meu Site" mostre o efeito de carregamento */}
          <Button
            size="lg"
            className="gradient-bg text-lg px-8 py-6"
            disabled={!isFormValid() || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando Site...
              </>
            ) : (
              "Finalizar Meu Site"
            )}
          </Button>
        </div>

        {!isFormValid() && (
          <p className="text-center text-amber-400 mt-4">
            Por favor, preencha todos os campos obrigatórios e escolha um plano para finalizar.
          </p>
        )}
      </div>
    </section>
  )
}
