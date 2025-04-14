import { NextResponse } from "next/server"
import { updatePaymentStatus, getPageById } from "@/lib/supabase"

export async function POST(request: Request) {
  console.log("Webhook da Kiwify recebido")

  try {
    // Obter o corpo da requisição
    const webhookData = await request.json()
    console.log("Dados do webhook:", JSON.stringify(webhookData, null, 2))

    // Verificar o token de autenticação
    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")

    // Verificar se o token é válido (pode estar no cabeçalho ou como parâmetro na URL)
    const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN || "hbmn3ylowx3"
    const isValidToken = token === webhookToken || webhookData.token === webhookToken

    if (!isValidToken) {
      console.error("Token de autenticação inválido")
      return NextResponse.json({ error: "Token de autenticação inválido" }, { status: 401 })
    }

    // Extrair a referência (ID da página) e o status do pagamento
    // A estrutura exata pode variar dependendo da configuração da Kiwify
    let reference = null
    let status = null

    // Tentar extrair de diferentes formatos possíveis
    if (webhookData.order) {
      reference = webhookData.order.reference || webhookData.order.order_ref
      status = webhookData.order.status || webhookData.order.order_status
    } else if (webhookData.data) {
      reference = webhookData.data.reference
      status = webhookData.data.status
    } else if (webhookData.reference && webhookData.status) {
      reference = webhookData.reference
      status = webhookData.status
    } else if (webhookData.transaction) {
      reference = webhookData.transaction.reference
      status = webhookData.transaction.status
    }

    if (!reference) {
      console.error("Referência (ID da página) não encontrada nos dados do webhook")
      return NextResponse.json({ error: "Referência (ID da página) não encontrada" }, { status: 400 })
    }

    console.log(`Processando pagamento para página ${reference} com status ${status}`)

    // Atualizar o status de pagamento no Supabase
    await updatePaymentStatus(reference, status)

    // Se o pagamento foi aprovado, enviar o email com a URL da página
    if (status === "approved" || status === "paid") {
      console.log(`Pagamento aprovado para página ${reference}, enviando email...`)

      // Buscar os dados da página no Supabase
      const pageData = await getPageById(reference)

      if (!pageData) {
        console.error(`Página ${reference} não encontrada`)
        return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
      }

      // Enviar o email com a URL da página
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-email`, {
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

      if (!response.ok) {
        console.error(`Erro ao enviar email: ${response.status} ${response.statusText}`)
        return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 })
      }

      console.log(`Email enviado com sucesso para ${pageData.email}`)
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      reference,
      status,
    })
  } catch (error) {
    console.error("Erro ao processar webhook da Kiwify:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
