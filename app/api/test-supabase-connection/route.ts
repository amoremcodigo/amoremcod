import { NextResponse } from "next/server"
import { createTestPage, listAllPages } from "@/lib/supabase"

export async function GET() {
  try {
    // Criar uma página de teste para verificar a conexão
    const testResult = await createTestPage()

    // Listar as páginas mais recentes
    const recentPages = await listAllPages(10)

    return NextResponse.json({
      success: true,
      message: "Teste de conexão com Supabase concluído",
      testPage: testResult,
      recentPages: recentPages?.map((page) => ({
        id: page.page_id,
        couple: page.couple_names,
        created: page.created_at,
        status: page.payment_status,
      })),
    })
  } catch (error) {
    console.error("Erro no teste de conexão:", error)
    return NextResponse.json(
      {
        error: "Erro no teste de conexão com Supabase",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
