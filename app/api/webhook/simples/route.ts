import { NextResponse } from "next/server"
import { updatePaymentStatus, getPagesByEmail } from "@/lib/supabase"

// Rota de webhook simplificada que aceita apenas o e-mail do cliente e o status
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
    const email = url.searchParams.get("email") || url.searchParams.get("customer_email")
    const status = url.searchParams.get("status") || "approved" // Usar "approved" como padrão

    console.log(`Parâmetros recebidos - email: ${email}, status: ${status}`)

    if (!email) {
      return NextResponse.json({ error: "E-mail do cliente não fornecido" }, { status: 400 })
    }

    // Buscar as páginas do cliente pelo e-mail
    const pages = await getPagesByEmail(email)

    // Se não encontramos nenhuma página, retornar erro
    if (!pages || pages.length === 0) {
      console.error(`Nenhuma página encontrada para o e-mail ${email}`)
      return NextResponse.json(
        {
          error: `Nenhuma página encontrada para o e-mail ${email}`,
          email,
        },
        { status: 404 },
      )
    }

    // Pegar a página mais recente (a primeira da lista, já que ordenamos por created_at desc)
    const pageData = pages[0]
    const pageId = pageData.page_id

    console.log(`Página encontrada: ${pageId} para o e-mail ${email}`)
    console.log(`Processando pagamento para página ${pageId} com status ${status}`)

    // Atualizar o status de pagamento no Supabase
    await updatePaymentStatus(pageId, status)

    // Se o pagamento foi aprovado, enviar o email com a URL da página
    if (status === "approved" || status === "paid") {
      console.log(`Pagamento aprovado para página ${pageId}, enviando email...`)

      // Enviar o email com o QR Code
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-email`, {
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

        if (!emailResponse.ok) {
          console.error(`Erro ao enviar email: ${emailResponse.status}`)
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
      email,
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
