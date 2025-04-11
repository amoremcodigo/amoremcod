import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Função para criar o cliente do Supabase
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltam variáveis de ambiente do Supabase")
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  console.log("Webhook da Kiwify recebido")

  try {
    // Verificar o token de autenticação
    const token = request.headers.get("x-kiwify-token")

    if (token !== process.env.KIWIFY_WEBHOOK_TOKEN) {
      console.error("Token de webhook inválido:", token)
      return NextResponse.json({ error: "Token de webhook inválido" }, { status: 401 })
    }

    // Obter os dados do corpo da requisição
    const data = await request.json()
    console.log("Dados do webhook:", JSON.stringify(data, null, 2))

    // Verificar se é um evento de pagamento aprovado/confirmado
    if (data.event !== "order.paid" && data.event !== "order.completed") {
      console.log(`Evento ignorado: ${data.event}`)
      return NextResponse.json({ success: true, message: "Evento ignorado" })
    }

    // Extrair o ID da página da referência
    const pageId = data.data?.reference || data.data?.metadata?.ref || ""

    if (!pageId) {
      console.error("ID da página não encontrado nos dados do webhook")
      return NextResponse.json({ error: "ID da página não encontrado" }, { status: 400 })
    }

    console.log(`Atualizando status de pagamento para a página: ${pageId}`)

    // Atualizar o status de pagamento no Supabase
    const supabase = createSupabaseClient()

    const { data: updateData, error } = await supabase
      .from("pages")
      .update({ payment_status: "paid" })
      .eq("page_id", pageId)
      .select()

    if (error) {
      console.error("Erro ao atualizar status de pagamento:", error)
      return NextResponse.json({ error: "Erro ao atualizar status de pagamento" }, { status: 500 })
    }

    if (updateData && updateData.length > 0) {
      console.log("Status de pagamento atualizado com sucesso:", updateData[0])

      // Enviar email de confirmação
      try {
        const { data: pageData } = await supabase.from("pages").select("*").eq("page_id", pageId).single()

        if (pageData) {
          // Obter a URL base do site a partir da requisição ou da variável de ambiente
          const siteUrl = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || ""

          // Construir a URL completa para a API de email
          const emailApiUrl = `${siteUrl}/api/send-email`

          const emailResponse = await fetch(emailApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: pageData.email,
              pageUrl: pageData.page_url,
              coupleNames: pageData.couple_names,
              qrCodeUrl: pageData.qr_code_url,
              isPending: false, // Pagamento confirmado
            }),
          })

          const emailResult = await emailResponse.json()
          console.log("Resultado do envio de email:", emailResult)
        }
      } catch (emailError) {
        console.error("Erro ao enviar email de confirmação:", emailError)
        // Continuar mesmo se falhar o envio do email
      }

      return NextResponse.json({
        success: true,
        message: "Status de pagamento atualizado com sucesso",
        page: updateData[0],
      })
    } else {
      console.error("Página não encontrada com o ID:", pageId)
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
    }
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
