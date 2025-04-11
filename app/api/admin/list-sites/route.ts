import { NextResponse } from "next/server"
import { listAllPages } from "@/lib/supabase"

export async function GET() {
  try {
    // Buscar todos os sites do Supabase
    const sites = await listAllPages(100) // Limitar a 100 sites para performance

    if (!sites) {
      return NextResponse.json({ error: "Erro ao buscar sites" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sites: sites,
    })
  } catch (error) {
    console.error("Erro ao listar sites:", error)
    return NextResponse.json(
      {
        error: "Erro ao listar sites",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
