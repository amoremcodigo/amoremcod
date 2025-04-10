import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Faltam variáveis de ambiente do Supabase" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Teste simples para verificar a conexão
    const { data, error } = await supabase.from("pages").select("count", { count: "exact" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Conexão com Supabase estabelecida com sucesso!",
      data,
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      },
    })
  } catch (error) {
    console.error("Erro ao conectar com Supabase:", error)
    return NextResponse.json(
      {
        error: "Erro ao conectar com Supabase",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
