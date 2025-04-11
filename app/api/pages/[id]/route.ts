import { NextResponse } from "next/server"
import { getPageById } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const pageId = params.id

    if (!pageId) {
      return NextResponse.json({ error: "ID da página não fornecido" }, { status: 400 })
    }

    // Buscar dados da página no Supabase
    const pageData = await getPageById(pageId)

    if (!pageData) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      page: pageData,
    })
  } catch (error) {
    console.error("Erro ao buscar página:", error)
    return NextResponse.json(
      {
        error: "Erro ao buscar página",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
