import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Criar o cliente do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const pageId = params.id

    if (!pageId) {
      return NextResponse.json({ error: "ID da página não fornecido" }, { status: 400 })
    }

    // Obter a nova mensagem do corpo da requisição
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Mensagem não fornecida" }, { status: 400 })
    }

    // Atualizar a mensagem no Supabase
    let result

    // Tentar primeiro com o cliente admin (se disponível)
    if (supabaseAdmin !== supabase) {
      const { data, error } = await supabaseAdmin
        .from("pages")
        .update({ message, updated_at: new Date().toISOString() })
        .eq("page_id", pageId)
        .select()

      if (error) {
        console.error("Erro ao atualizar mensagem com cliente admin:", error)

        // Se falhar com admin, tentar com cliente normal
        const normalResult = await supabase
          .from("pages")
          .update({ message, updated_at: new Date().toISOString() })
          .eq("page_id", pageId)
          .select()

        if (normalResult.error) {
          return NextResponse.json({ error: normalResult.error.message }, { status: 500 })
        }

        result = normalResult.data
      } else {
        result = data
      }
    } else {
      // Se não temos cliente admin, usar o cliente normal
      const { data, error } = await supabase
        .from("pages")
        .update({ message, updated_at: new Date().toISOString() })
        .eq("page_id", pageId)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      message: "Mensagem atualizada com sucesso",
      data: result,
    })
  } catch (error) {
    console.error("Erro ao atualizar mensagem:", error)
    return NextResponse.json(
      {
        error: "Erro ao atualizar mensagem",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
