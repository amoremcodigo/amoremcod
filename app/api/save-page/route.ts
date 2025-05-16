// Adicionar logs mais detalhados na API de salvamento
import { NextResponse } from "next/server"
import { savePage } from "@/lib/supabase"

export async function POST(request: Request) {
  console.log("=== API SAVE-PAGE: Recebendo solicitação ===")

  try {
    const pageData = await request.json()
    console.log("API SAVE-PAGE: Dados recebidos:", JSON.stringify(pageData))

    // Verificar se temos os campos obrigatórios
    if (!pageData.page_id || !pageData.email || !pageData.couple_names) {
      console.error("API SAVE-PAGE: Dados incompletos:", pageData)
      return NextResponse.json(
        { success: false, error: "Dados incompletos. Certifique-se de fornecer page_id, email e couple_names." },
        { status: 400 },
      )
    }

    // Salvar a página no Supabase
    console.log("API SAVE-PAGE: Chamando savePage...")
    const result = await savePage(pageData)
    console.log("API SAVE-PAGE: Resultado do savePage:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("API SAVE-PAGE: Erro ao processar solicitação:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        errorObject: JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}
