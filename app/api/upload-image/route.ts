import { NextResponse } from "next/server"

// Função para fazer upload da imagem para o Imgur
const uploadToImgur = async (base64Image: string): Promise<string> => {
  try {
    // Remover o prefixo do data URL se existir
    const base64Data = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image

    // Cliente ID do Imgur (anônimo)
    const clientId = "546c25a59c58ad7"

    console.log("API: Iniciando upload para Imgur...")

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
      console.log("API: Imagem enviada com sucesso para o Imgur:", data.data.link)
      return data.data.link
    } else {
      throw new Error("Falha ao fazer upload da imagem para o Imgur: " + (data.data.error || "Erro desconhecido"))
    }
  } catch (error) {
    console.error("API: Erro ao fazer upload da imagem para o Imgur:", error)
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

    // Fazer upload para o Imgur
    try {
      const imageUrl = await uploadToImgur(image)
      return NextResponse.json({ success: true, url: imageUrl })
    } catch (imgurError) {
      console.error("Erro no upload para Imgur:", imgurError)

      // Se falhar, retornar a imagem base64 original
      console.warn("Retornando a imagem base64 original como último recurso")
      return NextResponse.json({ success: true, url: image })
    }
  } catch (error) {
    console.error("Erro na API de upload de imagem:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
