import { NextResponse } from "next/server"

// Função para fazer upload da imagem para o ImgBB
const uploadToImgBB = async (base64Image: string): Promise<string> => {
  try {
    // Remover o prefixo do data URL se existir
    const base64Data = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image

    // Chave da API do ImgBB
    const apiKey = "b0aebf5fbd0f7f940e0184c796125175"

    console.log("API: Iniciando upload para ImgBB...")

    // Preparar os dados para o upload
    const formData = new FormData()
    formData.append("key", apiKey)
    formData.append("image", base64Data)

    // Fazer a requisição para a API do ImgBB
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Erro na resposta da API: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Verificar se o upload foi bem-sucedido
    if (data.success) {
      console.log("API: Imagem enviada com sucesso para o ImgBB:", data.data.url)
      return data.data.url
    } else {
      throw new Error("Falha ao fazer upload da imagem: " + (data.error?.message || "Erro desconhecido"))
    }
  } catch (error) {
    console.error("API: Erro ao fazer upload da imagem:", error)
    throw error
  }
}

// Adicionar esta nova função para upload para o Imgur
async function uploadToImgur(base64Image: string): Promise<string> {
  try {
    // Remover o prefixo do data URL se existir
    const base64Data = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image

    // Cliente ID do Imgur (anônimo)
    const clientId = "546c25a59c58ad7"

    console.log("Iniciando upload para Imgur...")

    // Fazer a requisição para a API do Imgur
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
    })

    if (!response.ok) {
      throw new Error(`Erro na resposta da API Imgur: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Verificar se o upload foi bem-sucedido
    if (data.success) {
      console.log("Imagem enviada com sucesso para o Imgur:", data.data.link)
      return data.data.link
    } else {
      throw new Error("Falha ao fazer upload da imagem para o Imgur: " + (data.data.error || "Erro desconhecido"))
    }
  } catch (error) {
    console.error("Erro ao fazer upload da imagem para o Imgur:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ success: false, error: "Imagem não fornecida" }, { status: 400 })
    }

    // Verificar se a imagem já é uma URL
    if (image.startsWith("http")) {
      return NextResponse.json({ success: true, url: image })
    }

    // Tentar fazer upload para o ImgBB primeiro
    try {
      const imageUrl = await uploadToImgBB(image)
      return NextResponse.json({ success: true, url: imageUrl })
    } catch (imgbbError) {
      console.error("Erro no upload para ImgBB, tentando método alternativo:", imgbbError)

      // Se falhar, tentar método alternativo (Imgur)
      try {
        const imgurUrl = await uploadToImgur(image)
        return NextResponse.json({ success: true, url: imgurUrl })
      } catch (imgurError) {
        console.error("Erro no upload para Imgur:", imgurError)

        // Se tudo falhar, retornar a imagem base64 original
        console.warn("Retornando a imagem base64 original como último recurso")
        return NextResponse.json({ success: true, url: image })
      }
    }
  } catch (error) {
    console.error("Erro na API de upload de imagem:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
