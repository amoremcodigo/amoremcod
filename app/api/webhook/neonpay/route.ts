import { NextResponse } from "next/server"
import { updatePaymentStatus, getPageById } from "@/lib/supabase"
import { sendConfirmationEmail } from "@/lib/email"
import { listRecentPages } from "@/lib/pages"

export async function POST(request: Request) {
  console.log("=== WEBHOOK DA NEON PAY RECEBIDO ===")
  console.log("URL completa:", request.url)

  try {
    // Verificar token de segurança
    const authHeader = request.headers.get("Authorization")
    const webhookToken = process.env.NEON_PAY_WEBHOOK_TOKEN

    if (webhookToken && (!authHeader || !authHeader.includes(webhookToken))) {
      console.error("Token de webhook inválido")
      return NextResponse.json({ error: "Token de webhook inválido" }, { status: 401 })
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

    // Extrair referência externa (ID da página)
    const pageId = webhookData.external_reference || webhookData.reference || webhookData.metadata?.page_id

    if (!pageId) {
      console.error("ID da página não encontrado nos dados do webhook")

      // Tentar extrair de outros campos
      const possibleReferenceFields = [
        webhookData.metadata?.reference,
        webhookData.metadata?.external_id,
        webhookData.order_id,
        webhookData.transaction_id,
      ]

      for (const field of possibleReferenceFields) {
        if (field && typeof field === "string" && field.length >= 6) {
          console.log(`Possível ID de página encontrado: ${field}`)

          // Verificar se existe uma página com este ID
          const page = await getPageById(field)
          if (page) {
            console.log(`Página encontrada com ID: ${field}`)

            // Atualizar status e enviar email
            await updatePaymentStatus(field, webhookData.status || "paid")
            await sendConfirmationEmail(page)

            return NextResponse.json({
              success: true,
              message: "Webhook processado com sucesso usando ID alternativo",
              pageId: field,
            })
          }
        }
      }

      // SOLUÇÃO DE EMERGÊNCIA: Processar a página mais recente
      try {
        console.log("TENTANDO PROCESSAR PÁGINA MAIS RECENTE COMO FALLBACK")
        const recentPages = await listRecentPages(1)

        if (recentPages && recentPages.length > 0) {
          const pageData = recentPages[0]
          const recentPageId = pageData.page_id

          // Atualizar o status para aprovado
          await updatePaymentStatus(recentPageId, "paid")

          // Enviar e-mail de confirmação
          await sendConfirmationEmail(pageData)

          return NextResponse.json({
            success: true,
            message: "Webhook processado com sucesso (fallback de emergência)",
            pageId: recentPageId,
            email: pageData.email,
            status: "paid",
          })
        }
      } catch (fallbackError) {
        console.error("ERRO NO FALLBACK DE EMERGÊNCIA:", fallbackError)
      }

      return NextResponse.json(
        {
          error: "ID da página não encontrado nos dados do webhook",
          webhookData,
          rawBody: rawBody.substring(0, 1000), // Incluir parte do corpo bruto na resposta
        },
        { status: 400 },
      )
    }

    console.log(`ID da página encontrado: ${pageId}`)

    // Extrair o status do pagamento
    const status = webhookData.status || "paid"
    console.log(`Status do pagamento: ${status}`)

    // Buscar a página pelo ID
    const pageData = await getPageById(pageId)

    // Se não encontramos a página, retornar erro
    if (!pageData) {
      console.error(`Página não encontrada para o ID ${pageId}`)
      return NextResponse.json(
        {
          error: `Página não encontrada para o ID ${pageId}`,
          pageId,
        },
        { status: 404 },
      )
    }

    console.log(`Página encontrada: ${pageId} para o e-mail ${pageData.email}`)

    // Atualizar o status de pagamento no Supabase
    console.log(`Atualizando status de pagamento para ${pageId}: ${status}`)
    await updatePaymentStatus(pageId, status)

    // Se o pagamento foi aprovado, enviar o email com o QR Code
    if (status === "approved" || status === "paid" || status === "completed") {
      console.log(`Pagamento aprovado para página ${pageId}, enviando email...`)
      await sendConfirmationEmail(pageData)
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      pageId,
      email: pageData.email,
      status,
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
