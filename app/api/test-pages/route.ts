import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Testar a conexão com a tabela pages
    const { data, error, count } = await supabase.from("pages").select("*", { count: "exact" }).limit(5)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Tabela 'pages' acessada com sucesso!",
      count,
      sample: data,
    })
  } catch (error) {
    console.error("Erro ao acessar tabela:", error)
    return NextResponse.json(
      {
        error: "Erro ao acessar tabela",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
