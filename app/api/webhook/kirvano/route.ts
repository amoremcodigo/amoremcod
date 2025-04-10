import { NextResponse } from "next/server"
import { getPageById, updatePaymentStatus } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // Verificar o token de segurança
    const token = request.headers.get("x-kirvano-token")

    if (token !== process.env.KIRVANO_WEBHOOK_TOKEN) {
      console.error("Token de webhook inválido")
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obter os dados do webhook
    const webhookData = await request.json()

    console.log("Webhook recebido:", webhookData)

    // Verificar se é um evento de pagamento confirmado
    if (webhookData.event === "payment.confirmed" || webhookData.event === "payment.approved") {
      // Extrair o ID da página dos dados personalizados ou da referência
      const pageId = webhookData.customData?.pageId || webhookData.reference || webhookData.ref

      if (!pageId) {
        console.error("ID da página não encontrado nos dados do webhook")
        return NextResponse.json({ error: "ID da página não encontrado" }, { status: 400 })
      }

      // Buscar os dados da página no Supabase
      const pageData = await getPageById(pageId)

      if (!pageData) {
        console.error("Página não encontrada no Supabase:", pageId)
        return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
      }

      // Atualizar o status de pagamento para "paid"
      await updatePaymentStatus(pageId, "paid")

      // Enviar email de confirmação
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/api/send-email`, {
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

        const emailResult = await emailResponse.json()

        if (emailResult.success) {
          console.log("Email de confirmação enviado com sucesso!")
        } else {
          console.error("Erro ao enviar email de confirmação:", emailResult.error)
        }
      } catch (emailError) {
        console.error("Erro ao enviar email de confirmação:", emailError)
      }

      return NextResponse.json({ success: true, message: "Status de pagamento atualizado" })
    }

    return NextResponse.json({ success: true, message: "Evento ignorado" })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
