import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  console.log("API save-page: Iniciando processamento da requisição")

  try {
    // Obter os dados da requisição
    const requestBody = await request.text()
    console.log("API save-page: Corpo da requisição recebido:", requestBody.substring(0, 200) + "...")

    const data = JSON.parse(requestBody)
    console.log("API save-page: Dados parseados com sucesso")

    // Verificar se temos as credenciais do Supabase
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("API save-page: Credenciais do Supabase não encontradas")
      return NextResponse.json({ error: "Credenciais do Supabase não configuradas" }, { status: 500 })
    }

    // Criar cliente do Supabase
    console.log("API save-page: Criando cliente do Supabase")
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Garantir que temos timestamps
    if (!data.created_at) {
      data.created_at = new Date().toISOString()
    }
    if (!data.updated_at) {
      data.updated_at = new Date().toISOString()
    }

    // Inserir os dados na tabela pages
    console.log("API save-page: Inserindo dados na tabela pages")
    const { data: insertedData, error } = await supabase.from("pages").insert([data]).select()

    if (error) {
      console.error("API save-page: Erro ao inserir dados no Supabase:", error)
      return NextResponse.json({ error: `Erro ao salvar página: ${error.message}` }, { status: 500 })
    }

    console.log("API save-page: Dados inseridos com sucesso:", insertedData)

    // Construir URL de checkout com referência ao ID da página
    const checkoutUrl =
      data.plan === "premium" ? "https://pay.kiwify.com.br/MN5HRnF" : "https://pay.kiwify.com.br/x7zu8ul"

    const checkoutUrlWithRef = `${checkoutUrl}?ref=${data.page_id}`

    // Retornar sucesso com a URL de checkout
    return NextResponse.json({
      success: true,
      message: "Página salva com sucesso",
      pageId: data.page_id,
      checkoutUrl: checkoutUrlWithRef,
    })
  } catch (error) {
    console.error("API save-page: Erro ao processar requisição:", error)
    return NextResponse.json(
      { error: `Erro ao processar requisição: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
      { status: 500 },
    )
  }
}
