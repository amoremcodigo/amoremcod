import { NextResponse } from "next/server"
import { savePage } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const pageData = await request.json()

    // Validar dados mínimos necessários
    if (!pageData.page_id || !pageData.email || !pageData.couple_names || !pageData.date) {
      return NextResponse.json(
        { success: false, error: "Dados incompletos. Verifique os campos obrigatórios." },
        { status: 400 },
      )
    }

    // Usar links da Kiwify
    const checkoutUrl =
      pageData.plan === "premium" ? "https://pay.kiwify.com.br/MN5HRnF" : "https://pay.kiwify.com.br/x7zu8ul"

    // Adicionar parâmetros de query para identificar o pedido
    const checkoutUrlWithParams = `${checkoutUrl}?ref=${pageData.page_id}`

    // Salvar os dados no Supabase
    await savePage(pageData)

    // Retornar sucesso e URL de checkout
    return NextResponse.json({
      success: true,
      message: "Página salva com sucesso",
      checkoutUrl: checkoutUrlWithParams,
    })
  } catch (error) {
    console.error("Erro ao salvar página:", error)

    // Retornar erro
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao salvar página",
      },
      { status: 500 },
    )
  }
}
