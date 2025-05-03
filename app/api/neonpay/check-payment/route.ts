import { NextResponse } from "next/server"
import { getPageById } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    // Obter o ID da página da query string
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get("pageId")

    if (!pageId) {
      return NextResponse.json({ error: "ID da página não fornecido" }, { status: 400 })
    }

    console.log(`Verificando pagamento para a página: ${pageId}`)

    // Buscar a página no Supabase
    const pageData = await getPageById(pageId)

    if (!pageData) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
    }

    // Retornar os dados da página, incluindo o status de pagamento
    return NextResponse.json({
      success: true,
      pageId,
      status: pageData.payment_status || "pending",
      plan: pageData.plan,
      created_at: pageData.created_at,
      updated_at: pageData.updated_at,
    })
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
