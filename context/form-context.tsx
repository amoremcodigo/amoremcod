"use client"

import { createContext, useState, useContext, type ReactNode } from "react"
import { compressToEncodedURIComponent } from "lz-string"
import { savePage } from "@/lib/supabase"

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

type FormData = {
  email: string
  coupleNames: string
  date: string
  time: string
  message: string
  youtubeLink: string
  photos: string[] // Array de fotos em base64
  photoUrls: string[] // Array de URLs das fotos no servidor
  plan: "basic" | "premium" | null
}

type FormContextType = {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  resetForm: () => void
  submitForm: () => Promise<void>
  isFormValid: () => boolean
  addPhoto: (photo: string, index: number) => void
  removePhoto: (index: number) => void
  resetPhotos: () => void
  updatePhotos: (photos: string[]) => void
  isSubmitting: boolean
}

// Modificar o initialFormData para definir o plano premium como padrão
const initialFormData: FormData = {
  email: "",
  coupleNames: "",
  date: "",
  time: "",
  message: "",
  youtubeLink: "",
  photos: ["", "", "", "", ""], // 5 espaços para fotos
  photoUrls: ["", "", "", "", ""], // 5 espaços para URLs
  plan: "premium", // Alterado de null para "premium" para selecionar por padrão
}

const FormContext = createContext<FormContextType | undefined>(undefined)

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

// Otimizar a função uploadImageToServer para ser mais rápida
const uploadImageToServer = async (base64Image: string, retryCount = 0, maxRetries = 2): Promise<string> => {
  try {
    // Verificar se a imagem já é uma URL (não base64)
    if (base64Image.startsWith("http")) {
      return base64Image
    }

    // Remover o prefixo do data URL se existir
    const base64Data = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image

    // Cliente ID do Imgur (anônimo)
    const clientId = "546c25a59c58ad7"

    // Reduzir o timeout para 15 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${clientId}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Data,
        type: "base64",
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      if (retryCount < maxRetries) {
        // Reduzir o tempo de espera entre tentativas
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return uploadImageToServer(base64Image, retryCount + 1, maxRetries)
      }
      // Se falhar, usar um placeholder
      return `/placeholder.svg?height=800&width=600&query=couple photo`
    }

    const data = await response.json()

    if (data.success) {
      return data.data.link
    } else {
      if (retryCount < maxRetries) {
        // Reduzir o tempo de espera entre tentativas
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return uploadImageToServer(base64Image, retryCount + 1, maxRetries)
      }
      // Se falhar, usar um placeholder
      return `/placeholder.svg?height=800&width=600&query=couple photo`
    }
  } catch (error) {
    if (retryCount < maxRetries) {
      // Reduzir o tempo de espera entre tentativas
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return uploadImageToServer(base64Image, retryCount + 1, maxRetries)
    }
    // Se falhar, usar um placeholder
    return `/placeholder.svg?height=800&width=600&query=couple photo`
  }
}

// Links para checkout da Kiwify
const KIWIFY_CHECKOUT_LINKS = {
  basic: "https://pay.kiwify.com.br/x7zu8ul",
  premium: "https://pay.kiwify.com.br/MN5HRnF",
}

export function FormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const resetForm = () => {
    setFormData(initialFormData)
  }

  const isFormValid = () => {
    // Verificações básicas de validação
    return (
      formData.email.includes("@") &&
      formData.coupleNames.trim() !== "" &&
      formData.date !== "" &&
      formData.message.trim() !== "" &&
      formData.plan !== null &&
      formData.photos.some((photo) => photo !== "") // Pelo menos uma foto
    )
  }

  // Adicionar uma foto em um índice específico
  const addPhoto = (photo: string, index: number) => {
    console.log(`FormContext: Adicionando foto no índice ${index}`)

    // Criar uma cópia do array de fotos
    const newPhotos = [...formData.photos]

    // Adicionar a nova foto no índice especificado
    newPhotos[index] = photo

    // Atualizar o estado com o novo array de fotos
    setFormData((prevState) => ({
      ...prevState,
      photos: newPhotos,
    }))

    console.log(`FormContext: Foto adicionada no índice ${index}`)
  }

  // Atualizar todas as fotos de uma vez
  const updatePhotos = (photos: string[]) => {
    console.log("FormContext: Atualizando todas as fotos")
    setFormData((prevState) => ({
      ...prevState,
      photos,
    }))
    console.log("FormContext: Fotos atualizadas:", photos.filter((p) => p).length)
  }

  // Remover uma foto de um índice específico
  const removePhoto = (index: number) => {
    const newPhotos = [...formData.photos]
    newPhotos[index] = ""

    const newPhotoUrls = [...formData.photoUrls]
    newPhotoUrls[index] = ""

    updateFormData({
      photos: newPhotos,
      photoUrls: newPhotoUrls,
    })
  }

  // Resetar todas as fotos
  const resetPhotos = () => {
    updateFormData({
      photos: ["", "", "", "", ""],
      photoUrls: ["", "", "", "", ""],
    })
  }

  // Otimizar a função submitForm para redirecionar mais rapidamente
  const submitForm = async () => {
    console.log("Iniciando submitForm, verificando formulário...")
    if (isFormValid()) {
      try {
        console.log("Formulário válido, iniciando processo de envio...")
        setIsSubmitting(true)

        // Normalizar o e-mail (trim e lowercase)
        const normalizedEmail = formData.email.trim().toLowerCase()
        console.log("Email normalizado:", normalizedEmail)

        // Capitalizar o nome do casal e substituir "e" por "&"
        const capitalizedCoupleNames = capitalizeWords(formData.coupleNames)
        console.log("Nome capitalizado:", capitalizedCoupleNames)

        // Atualizar o formData com o nome capitalizado e e-mail normalizado
        updateFormData({
          coupleNames: capitalizedCoupleNames,
          email: normalizedEmail,
        })

        // Generate a unique ID for the page
        const pageId = Math.random().toString(36).substring(2, 8)
        console.log("ID da página gerado:", pageId)

        // Criar um objeto com dados essenciais para a URL (versão compacta)
        const essentialData = {
          n: capitalizedCoupleNames, // Nome do casal
          d: formData.date, // Data
          m: formData.message, // Mensagem
          y: formData.youtubeLink, // Link do YouTube
          pl: formData.plan, // Plano
        }

        // Comprimir os dados para a URL
        const compressedData = compressDataForUrl(essentialData)

        // Construir a URL completa da página
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const pageUrl = `${siteUrl}/pagina/${pageId}?d=${compressedData}`
        console.log("URL da página:", pageUrl)

        // Usar links da Kiwify
        const checkoutUrl = formData.plan === "premium" ? KIWIFY_CHECKOUT_LINKS.premium : KIWIFY_CHECKOUT_LINKS.basic
        console.log("URL de checkout base:", checkoutUrl)

        // Adicionar parâmetros de query para identificar o pedido
        const checkoutUrlWithParams = `${checkoutUrl}?ref=${pageId}`
        console.log("URL de checkout completa:", checkoutUrlWithParams)

        // Salvar os dados no localStorage para backup
        try {
          localStorage.setItem(
            `page_${pageId}`,
            JSON.stringify({
              email: normalizedEmail,
              coupleNames: capitalizedCoupleNames,
              date: formData.date,
              time: formData.time,
              message: formData.message,
              youtubeLink: formData.youtubeLink,
              photos: formData.photos,
              plan: formData.plan,
              createdAt: new Date().toISOString(),
            }),
          )
          console.log("Dados salvos no localStorage")

          // Salvar o ID da página mais recente para recuperação na página de obrigado
          localStorage.setItem("lastPageId", pageId)
        } catch (localStorageError) {
          console.error("Erro ao salvar no localStorage:", localStorageError)
        }

        // Iniciar o processamento de imagens em segundo plano
        setTimeout(async () => {
          try {
            console.log("Iniciando processamento em segundo plano...")
            // Fazer upload das fotos para o servidor com retry
            const photoUrls = [...formData.photoUrls]
            for (let i = 0; i < formData.photos.length; i++) {
              if (formData.photos[i] && formData.photos[i].startsWith("data:image")) {
                try {
                  photoUrls[i] = await uploadImageToServer(formData.photos[i])
                  console.log(`Foto ${i + 1} enviada com sucesso:`, photoUrls[i].substring(0, 30) + "...")
                } catch (error) {
                  console.error(`Erro ao enviar foto ${i + 1}:`, error)
                  photoUrls[i] = `/placeholder.svg?height=800&width=600&query=couple photo ${i + 1}`
                }
              }
            }

            // Salvar os dados no Supabase
            try {
              console.log("Preparando dados para o Supabase...")
              const pageData = {
                page_id: pageId,
                email: normalizedEmail,
                couple_names: capitalizedCoupleNames,
                date: formData.date,
                message: formData.message,
                youtube_link: formData.youtubeLink || "",
                photo_urls: photoUrls.filter((url) => url), // Filtrar URLs vazias
                plan: formData.plan || "basic",
                page_url: pageUrl,
                qr_code_url: "",
              }

              console.log("Enviando dados para o Supabase...")
              const result = await savePage(pageData)
              console.log("Resultado do salvamento no Supabase:", result)
            } catch (dbError) {
              console.error("Erro ao salvar dados no Supabase:", dbError)
            }
          } catch (error) {
            console.error("Erro durante o processamento em segundo plano:", error)
          }
        }, 0)

        // Redirecionar para o checkout da Kiwify imediatamente
        console.log("Redirecionando para o checkout...")
        window.location.href = checkoutUrlWithParams
      } catch (error) {
        console.error("Erro durante o envio do formulário:", error)
        alert(
          "Ocorreu um erro, mas estamos tentando continuar. Por favor, verifique se sua página foi criada corretamente.",
        )
        setIsSubmitting(false)
      }
    } else {
      console.error("Formulário inválido!")
      alert("Por favor, preencha todos os campos obrigatórios e escolha um plano.")
      throw new Error("Formulário inválido")
    }
  }

  return (
    <FormContext.Provider
      value={{
        formData,
        updateFormData,
        resetForm,
        submitForm,
        isFormValid,
        addPhoto,
        removePhoto,
        resetPhotos,
        updatePhotos,
        isSubmitting,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}

export function useFormContext() {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider")
  }
  return context
}
