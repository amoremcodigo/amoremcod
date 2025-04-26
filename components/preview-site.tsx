"use client"

import { useState, useEffect } from "react"
import { Music, Heart, QrCode, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFormContext } from "@/context/form-context"
import { FallingHearts } from "@/components/falling-hearts"
import { compressToEncodedURIComponent } from "lz-string"

// Função para comprimir imagem antes do upload
const compressImage = async (base64Image: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        // Calcular as novas dimensões mantendo a proporção
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        // Criar canvas para redimensionar
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Não foi possível obter contexto 2D do canvas"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Converter para base64 com qualidade reduzida
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedBase64)
      }

      img.onerror = (error) => {
        console.error("Erro ao carregar imagem para compressão:", error)
        // Se falhar, retornar a imagem original
        resolve(base64Image)
      }

      img.src = base64Image
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error)
      // Se falhar, retornar a imagem original
      resolve(base64Image)
    }
  })
}

// Função para fazer upload da imagem para o ImgBB com retry
const uploadImageToServer = async (base64Image: string, retryCount = 0, maxRetries = 2): Promise<string> => {
  try {
    // Remover o prefixo do data URL se existir
    const base64Data = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image

    // Chave da API do ImgBB
    const apiKey = "b0aebf5fbd0f7f940e0184c796125175"

    console.log(`Iniciando upload para ImgBB (tentativa ${retryCount + 1}/${maxRetries + 1})...`)

    // Preparar os dados para o upload
    const formData = new FormData()
    formData.append("key", apiKey)
    formData.append("image", base64Data)

    // Fazer a requisição para a API do ImgBB com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos de timeout

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro na resposta da API ImgBB (tentativa ${retryCount + 1}):`, errorText)

      if (retryCount < maxRetries) {
        console.log(`Tentando novamente em ${(retryCount + 1) * 2} segundos...`)
        await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 2000))
        return uploadImageToServer(base64Image, retryCount + 1, maxRetries)
      }

      throw new Error(`Erro na resposta da API ImgBB: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Verificar se o upload foi bem-sucedido
    if (data.success) {
      console.log(`Imagem enviada com sucesso para o ImgBB (tentativa ${retryCount + 1}):`, data.data.url)
      return data.data.url
    } else {
      console.error(`Falha no upload para ImgBB (tentativa ${retryCount + 1}):`, data.error)

      if (retryCount < maxRetries) {
        console.log(`Tentando novamente em ${(retryCount + 1) * 2} segundos...`)
        await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 2000))
        return uploadImageToServer(base64Image, retryCount + 1, maxRetries)
      }

      throw new Error("Falha ao fazer upload da imagem: " + (data.error?.message || "Erro desconhecido"))
    }
  } catch (error) {
    console.error(`Erro ao fazer upload da imagem para o ImgBB (tentativa ${retryCount + 1}):`, error)

    if (retryCount < maxRetries) {
      console.log(`Tentando novamente em ${(retryCount + 1) * 2} segundos...`)
      await new Promise((resolve) => setTimeout(resolve, (retryCount + 1) * 2000))
      return uploadImageToServer(base64Image, retryCount + 1, maxRetries)
    }

    // Se todas as tentativas falharem, retornar uma URL de fallback
    console.warn("Todas as tentativas de upload falharam, usando URL de fallback")
    return "https://i.ibb.co/Wc1QZ2c/placeholder-image.jpg"
  }
}

// Função para capitalizar a primeira letra de cada palavra e substituir "e" por "&"
const capitalizeWords = (text: string): string => {
  if (!text) return text

  // Primeiro, substituir " e " por " & " (com espaços ao redor)
  const processedText = text.replace(/\s+e\s+/gi, " & ")

  return processedText
    .split(" ")
    .map((word) => {
      // Trata palavras com caracteres especiais como "&" ou "-"
      return word
        .split(/([&-])/)
        .map((part) => {
          // Se for um separador, retorna ele mesmo
          if (part === "&" || part === "-") return part
          // Se for uma palavra, capitaliza a primeira letra
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        })
        .join("")
    })
    .join(" ")
}

// Função para comprimir os dados para a URL
const compressDataForUrl = (data: any): string => {
  try {
    // Converter para JSON e comprimir
    const jsonString = JSON.stringify(data)
    return compressToEncodedURIComponent(jsonString)
  } catch (error) {
    console.error("Erro ao comprimir dados:", error)
    return ""
  }
}

// Função para upload paralelo de imagens
const uploadImagesInParallel = async (images: string[]): Promise<string[]> => {
  try {
    console.log(`Iniciando upload paralelo de ${images.length} imagens...`)

    // Primeiro, comprimir todas as imagens
    const compressPromises = images.map((img) =>
      img && img.startsWith("data:image") ? compressImage(img) : Promise.resolve(img),
    )

    const compressedImages = await Promise.all(compressPromises)
    console.log("Todas as imagens foram comprimidas")

    // Depois, fazer upload de todas as imagens em paralelo
    const uploadPromises = compressedImages.map((img) =>
      img && img.startsWith("data:image") ? uploadImageToServer(img) : Promise.resolve(img),
    )

    const results = await Promise.all(uploadPromises)
    console.log("Upload paralelo concluído com sucesso")

    return results
  } catch (error) {
    console.error("Erro no upload paralelo de imagens:", error)
    throw error
  }
}

// Função para formatar a data corretamente para o formato YYYY-MM-DD
const formatDateString = (dateStr: string): string => {
  if (!dateStr) return ""

  try {
    // Se for um timestamp ISO completo (contém "T"), extrair apenas a parte da data
    if (dateStr.includes("T")) {
      return dateStr.split("T")[0] // Retorna apenas YYYY-MM-DD
    }

    // Se já for uma data no formato YYYY-MM-DD, retornar como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }

    return ""
  } catch (e) {
    console.error("Erro ao formatar string de data:", e)
    return ""
  }
}

export function PreviewSite() {
  const { formData, isFormValid, isSubmitting, updateFormData } = useFormContext()
  const [years, setYears] = useState(0)
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Usar a data do formulário ou uma data padrão
  const startDate = formData.date
    ? new Date(`${formData.date}T${formData.time || "00:00:00"}`)
    : new Date(new Date().setFullYear(new Date().getFullYear() - 2))

  // Filtrar fotos válidas (não vazias)
  const validPhotos = formData.photos
    .filter((photo) => photo && (photo.startsWith("data:image") || photo.startsWith("http")))
    .map((photo, index) => photo || formData.photoUrls[index] || "")
    .filter((photo) => photo)

  // Verificar se temos pelo menos uma foto válida
  const hasValidPhoto = validPhotos.length > 0

  // Verificar se estamos no plano premium e temos mais de uma foto
  const hasCarousel = formData.plan === "premium" && validPhotos.length > 1

  // Atualizar o contador em tempo real
  useEffect(() => {
    const updateCounter = () => {
      const now = new Date()
      const difference = now.getTime() - startDate.getTime()

      // Calcular anos (aproximado, não considera anos bissextos)
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

  // Função para processar o formulário e salvar a página
  const processForm = async () => {
    if (!isFormValid() || isProcessing) return

    try {
      setIsProcessing(true)
      setError(null)
      setDebugInfo(null)
      console.log("=== INICIANDO PROCESSO DE SUBMISSÃO ===")

      // Normalizar o e-mail (trim e lowercase)
      const normalizedEmail = formData.email.trim().toLowerCase()

      // Capitalizar o nome do casal e substituir "e" por "&"
      const capitalizedCoupleNames = capitalizeWords(formData.coupleNames)

      // Formatar a data corretamente para o formato YYYY-MM-DD
      const formattedDate = formatDateString(formData.date || "")
      console.log("Data original:", formData.date)
      console.log("Data formatada:", formattedDate)

      // Atualizar o formData com o nome capitalizado, e-mail normalizado e data formatada
      updateFormData({
        coupleNames: capitalizedCoupleNames,
        email: normalizedEmail,
        date: formattedDate,
      })

      // Generate a unique ID for the page
      const pageId = Math.random().toString(36).substring(2, 8)
      console.log("ID da página gerado:", pageId)

      // Fazer upload das fotos para o servidor usando upload paralelo
      const photosToUpload = formData.photos.filter((photo) => photo && photo.startsWith("data:image"))

      if (photosToUpload.length > 0) {
        try {
          // Usar upload paralelo para todas as fotos
          const photoUrls = await uploadImagesInParallel(formData.photos)
          updateFormData({ photoUrls })
          console.log("Todas as fotos foram enviadas com sucesso:", photoUrls)
        } catch (uploadError) {
          console.error("Erro durante o upload de fotos:", uploadError)
          setError("Erro ao fazer upload das fotos. Por favor, tente novamente.")
          setIsProcessing(false)
          return // Não continuar se houver erro no upload das fotos
        }
      } else {
        console.log("Nenhuma foto para enviar")
      }

      // Criar um objeto com dados essenciais para a URL
      const essentialData = {
        n: capitalizedCoupleNames, // Nome do casal
        d: formattedDate, // Data formatada
        m: formData.message, // Mensagem
        y: formData.youtubeLink, // Link do YouTube
        p: formData.photoUrls.filter((url) => url), // URLs das fotos (filtrar vazias)
        pl: formData.plan, // Plano
      }

      // Comprimir os dados para a URL
      const compressedData = compressDataForUrl(essentialData)

      // Construir a URL completa da página
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const pageUrl = `${siteUrl}/pagina/${pageId}?d=${compressedData}`
      console.log("URL da página gerada:", pageUrl)

      // Gerar QR Code para o email
      let qrCodeUrl = null
      try {
        console.log("Gerando QR Code...")
        const QRCode = await import("qrcode")
        qrCodeUrl = await QRCode.toDataURL(pageUrl, {
          width: 300,
          margin: 1,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
        console.log("QR Code gerado com sucesso")
      } catch (qrError) {
        console.error("Erro ao gerar QR Code:", qrError)
        // Continuar mesmo sem QR code
      }

      // Preparar os dados da página
      const pageData = {
        page_id: pageId,
        email: normalizedEmail,
        couple_names: capitalizedCoupleNames,
        // Remover o campo time para evitar erros
        message: formData.message,
        youtube_link: formData.youtubeLink || "",
        photo_urls: formData.photoUrls.filter((url) => url), // Filtrar URLs vazias
        plan: formData.plan || "basic",
        page_url: pageUrl,
        qr_code_url: qrCodeUrl || "",
        payment_status: "pending",
      }

      // Salvar os dados usando a API
      console.log("Salvando dados via API...")

      try {
        const response = await fetch("/api/save-page", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pageData),
          cache: "no-store",
        })

        // Verificar se a resposta HTTP foi bem-sucedida
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Erro HTTP ${response.status}: ${errorText}`)
        }

        const result = await response.json()
        console.log("Resposta da API:", result)

        // Verificar explicitamente se o salvamento foi bem-sucedido
        if (result.success === true) {
          console.log("Página salva com sucesso, redirecionando para checkout:", result.checkoutUrl)

          // Adicionar um pequeno atraso para garantir que o console.log seja exibido
          setTimeout(() => {
            window.location.href = result.checkoutUrl
          }, 100)
        } else {
          // Se não foi bem-sucedido, mostrar erro e não redirecionar
          setError(`Erro ao salvar página: ${result.error || "Erro desconhecido"}`)
          setDebugInfo(JSON.stringify(result, null, 2))
          setIsProcessing(false)
        }
      } catch (apiError) {
        console.error("Erro na API de salvamento:", apiError)
        setError(
          `Erro na comunicação com o servidor: ${apiError instanceof Error ? apiError.message : String(apiError)}`,
        )
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Erro durante o processamento:", error)
      setError(`Erro ao processar formulário: ${error instanceof Error ? error.message : String(error)}`)
      setIsProcessing(false)
    }
  }

  return (
    <section className="w-full py-16 md:py-20 bg-black/30" id="preview">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Prévia <span className="gradient-text">simplificada</span> da sua página
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Esta é apenas uma demonstração básica para você ter uma ideia de como sua página personalizada ficará. A
              versão final terá mais recursos e melhor acabamento.
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
                  <div className="pt-0 pb-2 px-2 bg-gray-900 relative">
                    {/* Smartphone header - more delicate version */}
                    <div className="relative z-30 bg-gray-900/80 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 border-b border-gray-800/50">
                      <div className="flex justify-between items-center">
                        <div className="text-gray-300 font-light">14:25</div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
                          <div className="w-1 h-1 rounded-full bg-gray-500 mx-0.5"></div>
                          <div className="w-1 h-1 rounded-full bg-gray-500 mx-0.5"></div>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <div className="w-3 h-3 relative">
                            <div className="absolute inset-0.5 border border-gray-300 rounded-sm"></div>
                            <div className="absolute bottom-0.5 left-0.5 right-0.5 h-1.5 bg-gray-300 rounded-b-sm"></div>
                          </div>
                          <div className="flex space-x-0.5">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="h-2 w-0.5 bg-gray-300 rounded-full"
                                style={{ height: `${i * 0.15 + 0.3}rem` }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-center mt-0.5">
                        <span className="text-gray-400 text-opacity-80 font-light tracking-wide">
                          amoremcodigo.com.br
                        </span>
                      </div>
                    </div>

                    {/* Falling hearts contained within the phone screen - com velocidade aumentada */}
                    <div className="absolute inset-0 overflow-hidden z-20">
                      <FallingHearts density="medium" contained={true} speed="fast" />
                    </div>

                    {/* Adicionando espaço extra no topo para mover o nome para baixo */}
                    <div className="pt-6 relative z-10"></div>

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
                      <p className="text-center text-sm mb-1 text-gray-300">Juntos há</p>
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
                          <p className="text-gray-500 text-sm">Suas fotos aparecerão aqui</p>
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
                            "Cada momento ao seu lado é um presente. Você ilumina meus dias, transforma minha vida e faz meu coração transbordar de felicidade. Você é muito especial para mim! ❤️"
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

        <div className="flex flex-col items-center justify-center mt-12">
          {error && (
            <div className="text-red-500 mb-4 p-3 bg-red-100 border border-red-300 rounded-md max-w-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Erro ao salvar página</span>
              </div>
              <p>{error}</p>
              {debugInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Detalhes técnicos</summary>
                  <pre className="text-xs mt-2 p-2 bg-red-50 overflow-auto">{debugInfo}</pre>
                </details>
              )}
            </div>
          )}

          <Button
            size="lg"
            className="gradient-bg text-lg px-8 py-6 relative"
            disabled={!isFormValid() || isProcessing}
            onClick={processForm}
          >
            {isProcessing ? (
              <>
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Processando...</span>
                </div>
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
