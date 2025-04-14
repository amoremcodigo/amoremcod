import { NextResponse } from "next/server"
import { updatePaymentStatus, getPagesByEmail } from "@/lib/supabase"

export async function POST(request: Request) {
  console.log("=== WEBHOOK DA KIWIFY RECEBIDO ===")
  console.log("URL completa:", request.url)

  try {
    // Obter o corpo da requisição como texto bruto
    const rawBody = await request.text()
    console.log("Corpo bruto da requisição (primeiros 200 caracteres):", rawBody.substring(0, 200))

    // Tentar analisar como JSON
    let webhookData: any = {}
    try {
      webhookData = JSON.parse(rawBody)
      console.log("Dados do webhook (completo):", webhookData)
    } catch (e) {
      console.log("O corpo não é JSON válido, usando como texto bruto")
    }

    // FORMATO REAL DA KIWIFY:
    // {
    //   "order_id": "dcf5fb8c-e611-4d1d-9b6a-abe89d39054c",
    //   "order_ref": "ItTftqU",
    //   "order_status": "paid",
    //   "customer_email": "cliente@exemplo.com",
    //   ...
    // }

    // Extrair o status do pagamento
    const status = webhookData.order_status || webhookData.status || "pending"
    console.log(`Status do pagamento: ${status}`)

    // Extrair o e-mail do cliente
    const customerEmail = webhookData.customer_email || webhookData.email || webhookData.buyer_email || null
    console.log(`E-mail do cliente: ${customerEmail}`)

    // Se não temos o e-mail do cliente, não podemos continuar
    if (!customerEmail) {
      console.error("E-mail do cliente não encontrado nos dados do webhook")
      return NextResponse.json(
        {
          error: "E-mail do cliente não encontrado nos dados do webhook",
          webhookData,
        },
        { status: 400 },
      )
    }

    // Buscar as páginas do cliente pelo e-mail
    const pages = await getPagesByEmail(customerEmail)

    // Se não encontramos nenhuma página, retornar erro
    if (!pages || pages.length === 0) {
      console.error(`Nenhuma página encontrada para o e-mail ${customerEmail}`)
      return NextResponse.json(
        {
          error: `Nenhuma página encontrada para o e-mail ${customerEmail}`,
          customerEmail,
        },
        { status: 404 },
      )
    }

    // Pegar a página mais recente (a primeira da lista, já que ordenamos por created_at desc)
    const pageData = pages[0]
    const pageId = pageData.page_id

    console.log(`Página encontrada: ${pageId} para o e-mail ${customerEmail}`)

    // Atualizar o status de pagamento no Supabase
    console.log(`Atualizando status de pagamento para ${pageId}: ${status}`)
    await updatePaymentStatus(pageId, status)

    // Se o pagamento foi aprovado, enviar o email com o QR Code
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
      customerEmail,
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

// Adicionar suporte para GET para facilitar testes
export async function GET(request: Request) {
  console.log("=== WEBHOOK DA KIWIFY RECEBIDO VIA GET ===")
  return POST(request)
}
