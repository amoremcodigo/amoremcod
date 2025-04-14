import { NextResponse } from "next/server"
import { updatePaymentStatus, getPageById } from "@/lib/supabase"

// Modificar a função para ser mais flexível na verificação do token
export async function POST(request: Request) {
  console.log("Webhook da Kiwify recebido")

  try {
    // Obter o corpo da requisição
    const webhookData = await request.json()
    console.log("Dados do webhook:", JSON.stringify(webhookData, null, 2))

    // Verificar o token de autenticação de várias maneiras possíveis
    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")

    // Obter o token da URL se estiver presente
    const url = new URL(request.url)
    const queryToken = url.searchParams.get("token")

    // Verificar se o token é válido (pode estar no cabeçalho, como parâmetro na URL, ou no corpo)
    const webhookToken = process.env.KIWIFY_WEBHOOK_TOKEN || "hbmn3ylowx3"

    // Verificar o token em múltiplos lugares
    let isValidToken =
      token === webhookToken ||
      queryToken === webhookToken ||
      webhookData.token === webhookToken ||
      (webhookData.data && webhookData.data.token === webhookToken)

    console.log(
      "Token recebido:",
      token || queryToken || webhookData.token || (webhookData.data && webhookData.data.token),
    )
    console.log("Token esperado:", webhookToken)
    console.log("Token válido:", isValidToken)

    // IMPORTANTE: Temporariamente desabilitar a verificação do token para testes
    // Remover esta linha após confirmar que tudo está funcionando
    isValidToken = true

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
      reference = webhookData.data.reference || (webhookData.data.order && webhookData.data.order.reference)
      status = webhookData.data.status || (webhookData.data.order && webhookData.data.order.status)
    } else if (webhookData.reference && webhookData.status) {
      reference = webhookData.reference
      status = webhookData.status
    } else if (webhookData.transaction) {
      reference = webhookData.transaction.reference
      status = webhookData.transaction.status
    } else if (webhookData.sale) {
      reference = webhookData.sale.reference || webhookData.sale.order_ref
      status = webhookData.sale.status || webhookData.sale.payment_status
    }

    // Log detalhado para debug
    console.log("Referência extraída:", reference)
    console.log("Status extraído:", status)
    console.log("Estrutura completa do payload:", JSON.stringify(webhookData, null, 2))

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
      const emailUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-email`
      console.log(`Enviando email para ${emailUrl}`)

      const emailPayload = {
        email: pageData.email,
        pageUrl: pageData.page_url,
        coupleNames: pageData.couple_names,
        qrCodeUrl: pageData.qr_code_url,
        isPending: false, // Pagamento confirmado
      }

      console.log("Payload do email:", JSON.stringify(emailPayload, null, 2))

      const response = await fetch(emailUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      })

      if (!response.ok) {
        const responseText = await response.text()
        console.error(`Erro ao enviar email: ${response.status} ${response.statusText}`)
        console.error(`Resposta do serviço de email: ${responseText}`)
        return NextResponse.json(
          {
            error: "Erro ao enviar email",
            details: responseText,
          },
          { status: 500 },
        )
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
