import { NextResponse } from "next/server"
import { updatePaymentStatus, getPageById } from "@/lib/supabase"

// Rota de webhook simplificada que aceita apenas o ID da página e o status
export async function GET(request: Request) {
  console.log("=== WEBHOOK SIMPLES RECEBIDO (GET) ===")
  return handleWebhook(request)
}

export async function POST(request: Request) {
  console.log("=== WEBHOOK SIMPLES RECEBIDO (POST) ===")
  return handleWebhook(request)
}

async function handleWebhook(request: Request) {
  try {
    // Extrair parâmetros da URL
    const url = new URL(request.url)
    const pageId = url.searchParams.get("pageId") || url.searchParams.get("id") || url.searchParams.get("reference")
    const status = url.searchParams.get("status") || "approved" // Usar "approved" como padrão

    console.log(`Parâmetros recebidos - pageId: ${pageId}, status: ${status}`)

    if (!pageId) {
      return NextResponse.json({ error: "ID da página não fornecido" }, { status: 400 })
    }

    console.log(`Processando pagamento para página ${pageId} com status ${status}`)

    // Atualizar o status de pagamento no Supabase
    await updatePaymentStatus(pageId, status)

    // Se o pagamento foi aprovado, enviar o email com a URL da página
    if (status === "approved" || status === "paid") {
      console.log(`Pagamento aprovado para página ${pageId}, enviando email...`)

      // Buscar os dados da página no Supabase
      const pageData = await getPageById(pageId)

      if (!pageData) {
        console.error(`Página ${pageId} não encontrada`)
        return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
      }

      // Enviar o email com a URL da página
      try {
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

          // Continuar mesmo com erro no email
          console.log("Continuando apesar do erro no envio de email")
        } else {
          console.log(`Email enviado com sucesso para ${pageData.email}`)
        }
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError)
        // Continuar mesmo com erro no email
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      pageId,
      status,
    })
  } catch (error) {
    console.error("Erro ao processar webhook simples:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
