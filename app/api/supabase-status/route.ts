import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createTestPage, listAllPages } from "@/lib/supabase"

export async function GET() {
  try {
    // Obter as variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Verificar se as variáveis de ambiente estão definidas
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: "Variáveis de ambiente do Supabase não estão configuradas corretamente",
          env: {
            hasUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            hasServiceKey: !!supabaseServiceKey,
          },
        },
        { status: 500 },
      )
    }

    // Criar cliente Supabase com chave anônima
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Criar cliente Supabase com chave de serviço (se disponível)
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

    // Testar conexão com o Supabase
    const { data: healthData, error: healthError } = await supabase.from("pages").select("count", { count: "exact" })

    // Criar uma página de teste
    const testResult = await createTestPage()

    // Listar as páginas mais recentes
    const recentPages = await listAllPages(5)

    // Verificar a estrutura da tabela
    let tableStructure = null
    let tableError = null
    try {
      const { data, error } = await supabase.rpc("get_table_info", { table_name: "pages" })
      tableStructure = data
      tableError = error
    } catch (e) {
      tableError = e
    }

    return NextResponse.json({
      success: !healthError && testResult.success,
      message: "Diagnóstico do Supabase concluído",
      environment: {
        supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
      },
      healthCheck: {
        success: !healthError,
        data: healthData,
        error: healthError,
      },
      testPage: testResult,
      recentPages: recentPages?.map((page) => ({
        id: page.page_id,
        couple: page.couple_names,
        created: page.created_at,
        status: page.payment_status,
      })),
      tableStructure: {
        success: !tableError,
        data: tableStructure,
        error: tableError,
      },
    })
  } catch (error) {
    console.error("Erro no diagnóstico do Supabase:", error)
    return NextResponse.json(
      {
        error: "Erro no diagnóstico do Supabase",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
