import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

    // Tentar criar uma página de teste
    const testPageId = `test-${Date.now()}`
    const testPage = {
      page_id: testPageId,
      email: "teste@exemplo.com",
      couple_names: "Teste & Debug",
      date: new Date().toISOString().split("T")[0],
      time: "12:00:00",
      message: "Esta é uma página de teste para debug",
      youtube_link: "",
      photo_urls: ["https://picsum.photos/200/300"],
      plan: "basic",
      page_url: `https://amoremcodigo.com.br/pagina/${testPageId}`,
      qr_code_url: "",
      payment_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Tentar com cliente normal primeiro
    let insertResult = null
    let insertError = null
    try {
      const { data, error } = await supabase.from("pages").insert([testPage]).select()
      insertResult = data
      insertError = error
    } catch (e) {
      insertError = e
    }

    // Se falhar e tivermos o cliente admin, tentar com ele
    let adminInsertResult = null
    let adminInsertError = null
    if (insertError && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from("pages").insert([testPage]).select()
        adminInsertResult = data
        adminInsertError = error
      } catch (e) {
        adminInsertError = e
      }
    }

    // Verificar a estrutura da tabela
    const { data: tableInfo, error: tableError } = await supabase.rpc("get_table_info", { table_name: "pages" })

    return NextResponse.json({
      success: !healthError && (!insertError || !adminInsertError),
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
      insertTest: {
        success: !insertError,
        data: insertResult,
        error: insertError,
      },
      adminInsertTest: supabaseAdmin
        ? {
            success: !adminInsertError,
            data: adminInsertResult,
            error: adminInsertError,
          }
        : "Chave de serviço não disponível",
      tableStructure: {
        success: !tableError,
        data: tableInfo,
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
