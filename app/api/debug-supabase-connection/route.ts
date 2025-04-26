import { NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    console.log("=== TESTE DE CONEXÃO COM SUPABASE ===")

    // Testar conexão com cliente normal
    console.log("Testando cliente normal...")
    const { data: normalData, error: normalError } = await supabase.from("pages").select("count(*)").single()

    // Testar conexão com cliente admin
    console.log("Testando cliente admin...")
    const { data: adminData, error: adminError } = await supabaseAdmin.from("pages").select("count(*)").single()

    return NextResponse.json({
      success: true,
      normalClient: {
        connected: !normalError,
        data: normalData,
        error: normalError ? normalError.message : null,
      },
      adminClient: {
        connected: !adminError,
        data: adminData,
        error: adminError ? adminError.message : null,
      },
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configurado" : "não configurado",
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configurado" : "não configurado",
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "configurado" : "não configurado",
      },
    })
  } catch (error) {
    console.error("Erro ao testar conexão com Supabase:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
