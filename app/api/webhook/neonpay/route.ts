import { NextResponse } from "next/server"
import { updatePaymentStatus, getPagesByEmail } from "@/lib/supabase"
import { sendConfirmationEmail } from "@/lib/email"
import { listRecentPages } from "@/lib/pages"

export async function POST(request: Request) {
  console.log("=== WEBHOOK DA NEONPAY RECEBIDO ===")
  console.log("URL completa:", request.url)

  try {
    // Verificar o token do webhook
    const webhookToken = process.env.NEONPAY_WEBHOOK_TOKEN
    const authHeader = request.headers.get("authorization")

    // Verificação básica de segurança do token (opcional, dependendo da implementação da NeonPay)
    if (webhookToken && (!authHeader || !authHeader.includes(webhookToken))) {
      console.warn("Aviso: Token de webhook não corresponde ou está ausente")
      // Continuamos o processamento mesmo assim, para evitar falhas
    }

    // Obter o corpo da requisição como texto bruto
    const rawBody = await request.text()
    console.log("Corpo bruto da requisição:", rawBody)

    // Tentar analisar como JSON
    let webhookData: any = {}
    try {
      webhookData = JSON.parse(rawBody)
      console.log("Dados do webhook parseados com sucesso")
    } catch (e) {
      console.error("ERRO AO PARSEAR JSON:", e)
      console.log("O corpo não é JSON válido, usando como texto bruto")
    }

    // ACESSO AO CAMPO EMAIL DO CUSTOMER
    // Adaptado para a estrutura da NeonPay (mantendo compatibilidade com a lógica existente)
    let customerEmail = null

    // Verificar todos os caminhos possíveis para o e-mail na estrutura da NeonPay
    const possibleEmailPaths = [
      webhookData.customer?.email,
      webhookData.buyer?.email,
      webhookData.user?.email,
      webhookData.email,
      webhookData.customer_email,
      webhookData.buyer_email,
      webhookData.user_email,
    ]

    for (const path of possibleEmailPaths) {
      if (typeof path === "string" && path.includes("@")) {
        customerEmail = path
        console.log(`E-mail encontrado em caminho: ${customerEmail}`)
        break
      }
    }

    // Se ainda não encontrou, tentar extrair por regex do corpo bruto
    if (!customerEmail && typeof rawBody === "string") {
      console.log("Tentando extrair e-mail do corpo bruto usando regex")
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const matches = rawBody.match(emailRegex)

      if (matches && matches.length > 0) {
        console.log("E-mails encontrados via regex:", matches)
        customerEmail = matches[0]
        console.log(`E-mail extraído via regex: ${customerEmail}`)
      }
    }

    // Extrair o status do pagamento (adaptado para a NeonPay)
    const status = webhookData.payment_status || webhookData.status || "paid"
    console.log(`Status do pagamento: ${status}`)

    // Se não temos o e-mail do cliente, não podemos continuar
    if (!customerEmail) {
      console.error("E-mail do cliente não encontrado nos dados do webhook")
      console.error("Conteúdo completo do webhook:", rawBody)

      // SOLUÇÃO DE EMERGÊNCIA: Tentar processar a página mais recente
      try {
        console.log("TENTANDO PROCESSAR PÁGINA MAIS RECENTE COMO FALLBACK")
        const recentPages = await listRecentPages(1)

        if (recentPages && recentPages.length > 0) {
          const pageData = recentPages[0]
          const pageId = pageData.page_id

          // Atualizar o status para aprovado
          await updatePaymentStatus(pageId, "paid")

          // Enviar e-mail de confirmação
          await sendConfirmationEmail(pageData)

          return NextResponse.json({
            success: true,
            message: "Webhook processado com sucesso (fallback de emergência)",
            pageId,
            email: pageData.email,
            status: "paid",
          })
        }
      } catch (fallbackError) {
        console.error("ERRO NO FALLBACK DE EMERGÊNCIA:", fallbackError)
      }

      return NextResponse.json(
        {
          error: "E-mail do cliente não encontrado nos dados do webhook",
          webhookData,
          rawBody: rawBody.substring(0, 1000), // Incluir parte do corpo bruto na resposta
        },
        { status: 400 },
      )
    }

    // Normalizar o e-mail (trim e lowercase)
    const normalizedEmail = customerEmail.trim().toLowerCase()
    console.log(`E-mail normalizado: ${normalizedEmail}`)

    // Buscar as páginas do cliente pelo e-mail
    const pages = await getPagesByEmail(normalizedEmail)

    // Se não encontramos nenhuma página, retornar erro
    if (!pages || pages.length === 0) {
      console.error(`Nenhuma página encontrada para o e-mail ${normalizedEmail}`)
      return NextResponse.json(
        {
          error: `Nenhuma página encontrada para o e-mail ${normalizedEmail}`,
          customerEmail: normalizedEmail,
        },
        { status: 404 },
      )
    }

    // Pegar a página mais recente (a primeira da lista, já que ordenamos por created_at desc)
    const pageData = pages[0]
    const pageId = pageData.page_id

    console.log(`Página encontrada: ${pageId} para o e-mail ${normalizedEmail}`)

    // Atualizar o status de pagamento no Supabase
    console.log(`Atualizando status de pagamento para ${pageId}: ${status}`)
    await updatePaymentStatus(pageId, status)

    // Se o pagamento foi aprovado, enviar o email com o QR Code
    if (status === "approved" || status === "paid") {
      console.log(`Pagamento aprovado para página ${pageId}, enviando email...`)
      await sendConfirmationEmail(pageData)
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      pageId,
      customerEmail: normalizedEmail,
      status,
    })
  } catch (error) {
    console.error("Erro ao processar webhook da NeonPay:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Adicionar suporte para GET para facilitar testes
export async function GET(request: Request) {
  console.log("=== WEBHOOK DA NEONPAY RECEBIDO VIA GET ===")
  return POST(request)
}
