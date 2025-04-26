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

export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ success: false, error: "Imagem não fornecida" }, { status: 400 })
    }

    // Fazer upload da imagem para o ImgBB
    const imageUrl = await uploadToImgBB(image)

    // Retornar a URL da imagem
    return NextResponse.json({ success: true, url: imageUrl })
  } catch (error) {
    console.error("Erro na API de upload de imagem:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
