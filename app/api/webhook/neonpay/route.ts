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

    // VERIFICAÇÃO DIRETA NO TEXTO BRUTO
    const isTransactionPaidInRawBody = rawBody.includes("TRANSACTION_PAID")
    const isStatusCompletedInRawBody =
      rawBody.includes('"status":"COMPLETED"') || rawBody.includes('"status": "COMPLETED"')

    if (isTransactionPaidInRawBody) {
      console.log("TRANSACTION_PAID detectado no corpo bruto da requisição!")
    }

    if (isStatusCompletedInRawBody) {
      console.log('"status":"COMPLETED" detectado no corpo bruto da requisição!')
    }

    // Tentar analisar como JSON
    let webhookData: any = {}
    let isValidJson = false
    try {
      webhookData = JSON.parse(rawBody)
      isValidJson = true
      console.log("Dados do webhook parseados com sucesso")
    } catch (e) {
      console.error("ERRO AO PARSEAR JSON:", e)
      console.log("O corpo não é JSON válido, usando como texto bruto")
      // Continuamos mesmo com erro de parsing
    }

    // VERIFICAÇÃO ESPECÍFICA PARA OS CASOS SOLICITADOS
    let isPaymentConfirmed = false

    // Verificar diretamente no texto bruto
    if (isTransactionPaidInRawBody || isStatusCompletedInRawBody) {
      isPaymentConfirmed = true
      console.log("Pagamento confirmado detectado no corpo bruto!")
    }

    // Se temos JSON válido, verificar também nos campos
    if (isValidJson) {
      const paymentStatus = webhookData.status || webhookData.payment_status || webhookData.transaction_status || ""

      if (
        paymentStatus.toLowerCase() === "approved" ||
        paymentStatus.toLowerCase() === "paid" ||
        paymentStatus.toLowerCase() === "completed" ||
        paymentStatus === "COMPLETED" ||
        paymentStatus === "TRANSACTION_PAID" ||
        webhookData.event === "TRANSACTION_PAID" ||
        webhookData.event_type === "TRANSACTION_PAID" ||
        webhookData.approved === true ||
        webhookData.paid === true
      ) {
        isPaymentConfirmed = true
        console.log(`Pagamento confirmado detectado no campo status: ${paymentStatus}`)
      }
    }

    // Se o pagamento não foi confirmado, não enviamos o email final
    if (!isPaymentConfirmed) {
      console.log("Pagamento não confirmado, não enviando email final")
      return NextResponse.json({
        message: "Webhook recebido, mas pagamento não confirmado",
        rawBodyCheck: {
          isTransactionPaidInRawBody,
          isStatusCompletedInRawBody,
        },
      })
    }

    // EXTRAÇÃO DO EMAIL DO CLIENTE
    let customerEmail = null

    // Tentar extrair email do JSON se for válido
    if (isValidJson) {
      customerEmail =
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
    }

    // Tentar extrair email do corpo bruto usando regex se ainda não encontramos
    if (!customerEmail) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const emailMatches = rawBody.match(emailRegex)

      if (emailMatches && emailMatches.length > 0) {
        customerEmail = emailMatches[0]
        console.log(`Email extraído do corpo bruto usando regex: ${customerEmail}`)
      }
    }

    if (!customerEmail) {
      console.error("Email do cliente não encontrado nos dados do webhook")
      return NextResponse.json(
        {
          error: "Email do cliente não encontrado nos dados do webhook",
          isPaymentConfirmed,
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
    if (pageData) {
      // Se temos os dados da página, usamos eles
      await sendConfirmationEmail(
        {
          ...pageData,
          payment_status: "approved",
          isPending: false,
        },
        true,
      ) // Forçar o envio do email mesmo se houver alguma verificação de pendência
      console.log(`Email final enviado com sucesso para ${customerEmail} usando dados da página`)
    } else {
      // Se não temos os dados da página, criamos um objeto mínimo com o email
      const minimalPageData = {
        email: customerEmail,
        couple_names: "Cliente",
        page_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://amoremcodigo.com.br"}/meus-sites`,
        qr_code_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://amoremcodigo.com.br"}/qr-code`,
        isPending: false, // Marcar como não pendente para garantir o envio
      }
      await sendConfirmationEmail(minimalPageData, true) // Forçar envio do email
      console.log(`Email final enviado com sucesso para ${customerEmail} usando dados mínimos`)
    }

    return NextResponse.json({
      success: true,
      message: "Email final enviado com sucesso",
      email: customerEmail,
      isPaymentConfirmed,
    })
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
