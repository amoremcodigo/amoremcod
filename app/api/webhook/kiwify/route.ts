import { NextResponse } from "next/server"
import { updatePaymentStatus } from "@/lib/supabase"

export async function POST(request: Request) {
  console.log("Webhook da Kiwify recebido")

  try {
    // Extrair os dados do corpo da requisição
    const webhookData = await request.json()
    console.log("Dados do webhook:", JSON.stringify(webhookData, null, 2))

    // Verificar se temos os dados necessários
    if (!webhookData || !webhookData.order) {
      console.error("Dados do webhook incompletos")
      return NextResponse.json({ error: "Dados do webhook incompletos" }, { status: 400 })
    }

    const order = webhookData.order
    const status = order.order_status
    const reference = order.order_ref // Referência do pedido

    // Verificar se temos a referência (ID da página)
    if (!reference) {
      console.error("Referência (ID da página) ausente")
      return NextResponse.json({ error: "Referência (ID da página) ausente" }, { status: 400 })
    }

    console.log(`Atualizando status de pagamento para página ${reference}: ${status}`)

    // Atualizar o status de pagamento no Supabase
    await updatePaymentStatus(reference, status)

    // Se o pagamento foi aprovado, enviar o email com o QR Code
    if (status === "approved" || status === "paid") {
      console.log(`Pagamento aprovado para página ${reference}, enviando email...`)

      // Buscar os dados da página no Supabase
      const { getPageById } = await import("@/lib/supabase")
      const pageData = await getPageById(reference)

      if (!pageData) {
        console.error(`Página ${reference} não encontrada`)
        return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
      }

      // Enviar o email com o QR Code
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
      } else {
        console.log(`Email enviado com sucesso para ${pageData.email}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar webhook da Kiwify:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
