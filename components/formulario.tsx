"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Info, ImageIcon, Music } from "lucide-react"
import { useFormContext } from "@/context/form-context"

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

// Função para comprimir a imagem
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        // Criar um canvas para redimensionar a imagem
        const canvas = document.createElement("canvas")
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800

        let width = img.width
        let height = img.height

        // Calcular as novas dimensões mantendo a proporção
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar a imagem redimensionada no canvas
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)

        // Converter para base64 com qualidade reduzida
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7)

        // Verificar o tamanho da imagem comprimida
        const sizeInKB = Math.round(dataUrl.length / 1024)
        console.log(`Imagem comprimida: ${sizeInKB}KB`)

        resolve(dataUrl)
      }

      img.onerror = () => {
        reject(new Error("Erro ao carregar a imagem"))
      }
    }

    reader.onerror = () => {
      reject(new Error("Erro ao ler o arquivo"))
    }
  })
}

export function Formulario() {
  const { formData, updateFormData, addPhoto, removePhoto, updatePhotos } = useFormContext()
  const [photoPreview, setPhotoPreview] = useState<(string | null)[]>([null, null, null, null, null])
  const [isUploading, setIsUploading] = useState<boolean[]>([false, false, false, false, false])
  const [uploadError, setUploadError] = useState<(string | null)[]>([null, null, null, null, null])
  const [charCount, setCharCount] = useState(0)
  const MAX_CHARS = 500
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Inicializar com as fotos existentes, se houver
  useEffect(() => {
    const newPhotoPreview = [...photoPreview]

    formData.photos.forEach((photo, index) => {
      if (photo && photo.startsWith("data:image")) {
        newPhotoPreview[index] = photo
      }
    })

    setPhotoPreview(newPhotoPreview)

    // Inicializar o contador de caracteres
    setCharCount(formData.message.length)
  }, [formData.photos, formData.message])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target

    // Se for o campo de nomes do casal, capitalizar as primeiras letras e substituir "e" por "&"
    if (id === "coupleNames") {
      updateFormData({ [id]: capitalizeWords(value) })
    }
    // Se for o campo de mensagem, verificar o limite de caracteres
    else if (id === "message") {
      if (value.length <= MAX_CHARS) {
        updateFormData({ [id]: value })
        setCharCount(value.length)
      }
    } else {
      updateFormData({ [id]: value })
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target

    // Verificar se o valor é uma data válida
    if (value) {
      const [year, month, day] = value.split("-")

      // Verificar se o ano tem mais de 4 dígitos
      if (year && year.length > 4) {
        // Limitar o ano para 4 dígitos
        const limitedYear = year.substring(0, 4)
        const formattedDate = `${limitedYear}-${month}-${day}`

        // Atualizar o valor do input
        e.target.value = formattedDate

        // Atualizar o estado
        updateFormData({ date: formattedDate })
        return
      }
    }

    // Se não precisar de correção, atualizar normalmente
    updateFormData({ date: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })
  }

  // Função simplificada para lidar com o upload de fotos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, startIndex: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    console.log(`Processando ${files.length} fotos a partir do índice ${startIndex}`)

    // Verificar quantas fotos já existem
    const existingPhotosCount = formData.photos.filter((photo) => photo !== "").length

    // Criar cópias dos estados atuais
    const newIsUploading = [...isUploading]
    const newUploadError = [...uploadError]
    const newPhotoPreview = [...photoPreview]
    const newPhotos = [...formData.photos]

    // Verificar se ultrapassará o limite de 5 fotos
    if (existingPhotosCount + files.length > 5) {
      const remainingSlots = Math.max(0, 5 - existingPhotosCount)
      alert(
        `Você só pode adicionar até 5 fotos no total. ${remainingSlots > 0 ? `Você ainda pode adicionar ${remainingSlots} foto(s).` : "Você já atingiu o limite de fotos."}`,
      )

      // Se não houver slots restantes, retornar
      if (remainingSlots <= 0) return
    }

    // Processar cada arquivo
    for (let i = 0; i < files.length; i++) {
      const currentIndex = startIndex + i

      // Parar se atingirmos o máximo de 5 fotos
      if (currentIndex >= 5) {
        console.log(`Limite de 5 fotos atingido. Ignorando fotos adicionais.`)
        break
      }

      // Verificar se já atingimos o limite total de 5 fotos
      const currentTotalPhotos = newPhotos.filter((photo) => photo !== "").length
      if (currentTotalPhotos >= 5) {
        console.log(`Limite total de 5 fotos atingido.`)
        break
      }

      const file = files[i]
      console.log(`Processando foto ${i + 1}/${files.length} para o slot ${currentIndex + 1}`)

      // Atualizar estado de carregamento
      newIsUploading[currentIndex] = true
      setIsUploading([...newIsUploading])

      // Limpar erro anterior
      newUploadError[currentIndex] = null
      setUploadError([...newUploadError])

      try {
        // Verificar o tamanho do arquivo
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > 5) {
          console.error(`Arquivo muito grande (${fileSizeMB.toFixed(1)}MB) para o slot ${currentIndex + 1}`)
          newUploadError[currentIndex] = `Arquivo muito grande (${fileSizeMB.toFixed(1)}MB). O tamanho máximo é 5MB.`
          setUploadError([...newUploadError])
          continue
        }

        // Criar URL para preview
        const objectUrl = URL.createObjectURL(file)
        newPhotoPreview[currentIndex] = objectUrl
        setPhotoPreview([...newPhotoPreview])

        // Comprimir a imagem
        const compressedImage = await compressImage(file)

        // Adicionar a foto ao array
        newPhotos[currentIndex] = compressedImage

        console.log(`Foto ${currentIndex + 1} processada com sucesso`)
      } catch (error) {
        console.error(`Erro ao processar imagem ${currentIndex + 1}:`, error)
        newUploadError[currentIndex] = "Erro ao processar a imagem."
        setUploadError([...newUploadError])
      } finally {
        // Finalizar o carregamento
        newIsUploading[currentIndex] = false
        setIsUploading([...newIsUploading])
      }
    }

    // Atualizar todas as fotos de uma vez
    updatePhotos(newPhotos)

    console.log(`Processamento de múltiplas fotos concluído`)
  }

  const handleRemovePhoto = (index: number) => {
    // Limpar o input de arquivo
    if (fileInputRefs[index].current) {
      fileInputRefs[index].current.value = ""
    }

    // Remover preview
    const newPhotoPreview = [...photoPreview]
    if (newPhotoPreview[index]) {
      URL.revokeObjectURL(newPhotoPreview[index] as string)
      newPhotoPreview[index] = null
      setPhotoPreview(newPhotoPreview)
    }

    // Limpar erro
    const newUploadError = [...uploadError]
    newUploadError[index] = null
    setUploadError(newUploadError)

    // Atualizar o contexto
    removePhoto(index)
  }

  return (
    <section className="w-full py-16 md:py-20" id="formulario">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Crie sua <span className="gradient-text">página personalizada</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Preencha os dados abaixo para criar uma página especial para alguém importante em sua vida.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <Card className="border-gray-800 bg-black/50">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Informações</CardTitle>
                <CardDescription>Preencha os dados básicos para personalizar sua página.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Seu E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-gray-400">Usaremos para enviar o QR Code e Link da sua página.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupleNames">Nomes</Label>
                  <Input
                    id="coupleNames"
                    placeholder="Ex: Maria & João, Família Silva, Eu & Rex..."
                    value={formData.coupleNames}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Juntos desde</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={handleDateChange}
                      required
                      className="bg-transparent"
                      placeholder="dd/mm/aaaa"
                      max="9999-12-31" // Adicionar limite máximo para o ano
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário (opcional)</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="bg-transparent"
                      placeholder="--:--"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="message">Mensagem Especial</Label>
                    <span className={`text-xs ${charCount > MAX_CHARS * 0.9 ? "text-amber-500" : "text-gray-400"}`}>
                      {charCount}/{MAX_CHARS}
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Escreva uma mensagem especial para seu amor..."
                    className="min-h-[120px]"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    maxLength={MAX_CHARS}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeLink">Link da Música no YouTube (opcional)</Label>
                  <Input
                    id="youtubeLink"
                    placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    value={formData.youtubeLink}
                    onChange={handleChange}
                  />
                  <div className="mt-1 text-sm flex items-center gap-1 whitespace-nowrap">
                    <a
                      href="https://www.youtube.com.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                    >
                      <Music className="h-4 w-4" />
                      Ir para o YouTube
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Fotos <span className="text-xs text-gray-400 ml-2">(máximo 5 fotos)</span>
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Repetir para cada slot de foto */}
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div key={index} className="space-y-1">
                        <div className="border-2 border-dashed border-gray-700 rounded-lg p-2 flex flex-col items-center justify-center h-40 hover:border-primary transition-colors relative">
                          {isUploading[index] ? (
                            <div className="flex flex-col items-center justify-center h-full">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
                              <p className="text-gray-400 text-xs">Processando...</p>
                            </div>
                          ) : photoPreview[index] ? (
                            <div className="w-full h-full relative">
                              <img
                                src={photoPreview[index] || "/placeholder.svg"}
                                alt={`Foto ${index + 1} do casal`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="file-input-wrapper flex flex-col items-center justify-center w-full h-full">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handlePhotoUpload(e, index)}
                                ref={fileInputRefs[index]}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <ImageIcon className="h-8 w-8 text-gray-500 mb-2" />
                              <p className="text-center text-gray-400 text-xs">
                                {index === 0 ? "Foto principal (obrigatória)" : `Foto ${index + 1} (opcional)`}
                              </p>
                            </div>
                          )}
                        </div>
                        {uploadError[index] && (
                          <div className="flex items-center text-amber-500 text-xs">
                            <Info className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span>{uploadError[index]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full gradient-bg">
                  Continuar para Escolher o Plano
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </section>
  )
}
