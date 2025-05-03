import { NextResponse } from "next/server"
import { updatePaymentStatus, getPagesByEmail } from "@/lib/supabase"
import { sendConfirmationEmail } from "@/lib/email"

export async function POST(request: Request) {
  console.log("=== WEBHOOK DA NEON PAY RECEBIDO ===")

  try {
    // Verificar token de segurança
    const authHeader = request.headers.get("Authorization")
    const webhookToken = process.env.NEON_PAY_WEBHOOK_TOKEN

    if (webhookToken && (!authHeader || !authHeader.includes(webhookToken))) {
      console.error("Token de webhook inválido")
      // Continuamos mesmo com token inválido
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
      // Continuamos mesmo com erro de parsing
    }

    // Verificar se o pagamento foi confirmado - ADICIONANDO VERIFICAÇÃO ESPECÍFICA PARA "TRANSACTION_PAID"
    const paymentStatus = webhookData.status || webhookData.payment_status || webhookData.transaction_status || ""
    const isPaymentConfirmed =
      paymentStatus.toLowerCase() === "approved" ||
      paymentStatus.toLowerCase() === "paid" ||
      paymentStatus.toLowerCase() === "completed" ||
      paymentStatus.toLowerCase() === "approved" ||
      paymentStatus === "TRANSACTION_PAID" || // Verificação específica para TRANSACTION_PAID
      webhookData.event === "TRANSACTION_PAID" || // Verificação no campo event
      webhookData.event_type === "TRANSACTION_PAID" || // Verificação no campo event_type
      webhookData.approved === true ||
      webhookData.paid === true

    // Log específico para TRANSACTION_PAID
    if (
      paymentStatus === "TRANSACTION_PAID" ||
      webhookData.event === "TRANSACTION_PAID" ||
      webhookData.event_type === "TRANSACTION_PAID"
    ) {
      console.log("TRANSACTION_PAID detectado! Processando pagamento confirmado.")
    }

    // Se o pagamento não foi confirmado, não enviamos o email final
    if (!isPaymentConfirmed) {
      console.log("Pagamento não confirmado, não enviando email final")
      return NextResponse.json({
        message: "Webhook recebido, mas pagamento não confirmado",
        status: paymentStatus,
      })
    }

    // FOCO EXCLUSIVO NO EMAIL DO CLIENTE
    const customerEmail =
      webhookData.customer?.email ||
      webhookData.email ||
      webhookData.buyer_email ||
      webhookData.payer_email ||
      webhookData.metadata?.email ||
      webhookData.client_email ||
      webhookData.user_email ||
      webhookData.data?.email ||
      webhookData.customer_email ||
      (webhookData.customer && webhookData.customer.email) ||
      (webhookData.buyer && webhookData.buyer.email) ||
      (webhookData.payer && webhookData.payer.email) ||
      (webhookData.transaction && webhookData.transaction.customer_email)

    if (!customerEmail) {
      console.error("Email do cliente não encontrado nos dados do webhook")
      return NextResponse.json(
        {
          error: "Email do cliente não encontrado nos dados do webhook",
        },
        { status: 400 },
      )
    }

    console.log(`Email do cliente encontrado: ${customerEmail}`)

    // Buscar páginas associadas a este email
    let pageData = null
    try {
      const pages = await getPagesByEmail(customerEmail, 1)

      if (pages && pages.length > 0) {
        pageData = pages[0] // Pegar a página mais recente deste cliente
        console.log(`Página encontrada para o email ${customerEmail}: ${pageData.page_id}`)

        // Atualizar o status para aprovado
        try {
          await updatePaymentStatus(pageData.page_id, "paid")
        } catch (updateError) {
          console.error("Erro ao atualizar status de pagamento:", updateError)
          // Continuamos mesmo com erro na atualização
        }
      } else {
        console.error(`Nenhuma página encontrada para o email ${customerEmail}`)
        // Continuamos mesmo sem encontrar a página
      }
    } catch (dbError) {
      console.error("Erro ao buscar páginas no banco de dados:", dbError)
      // Continuamos mesmo com erro no banco de dados
    }

    // ENVIAR EMAIL FINAL INDEPENDENTEMENTE DE ERROS
    try {
      if (pageData) {
        // Se temos os dados da página, usamos eles
        await sendConfirmationEmail(pageData)
        console.log(`Email final enviado com sucesso para ${customerEmail} usando dados da página`)
      } else {
        // Se não temos os dados da página, criamos um objeto mínimo com o email
        const minimalPageData = {
          email: customerEmail,
          couple_names: "Cliente",
          page_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://amoremcodigo.com.br"}/meus-sites`,
          qr_code_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://amoremcodigo.com.br"}/qr-code`,
        }
        await sendConfirmationEmail(minimalPageData)
        console.log(`Email final enviado com sucesso para ${customerEmail} usando dados mínimos`)
      }

      return NextResponse.json({
        success: true,
        message: "Email final enviado com sucesso",
        email: customerEmail,
      })
    } catch (emailError) {
      console.error("Erro ao enviar email final:", emailError)
      return NextResponse.json(
        {
          error: "Erro ao enviar email final",
          details: emailError instanceof Error ? emailError.message : String(emailError),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao processar webhook da Neon Pay:", error)
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
  console.log("=== WEBHOOK DA NEON PAY RECEBIDO VIA GET ===")
  return POST(request)
}
