import { NextResponse } from "next/server"
import { getPageById, updatePaymentStatus } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    console.log("Webhook da Kirvano recebido")

    // Verificar o token de segurança
    const token = request.headers.get("x-kirvano-token")

    // Verificação do token - usando o token fixo '123456'
    if (token !== "123456") {
      console.error(`Token inválido recebido: ${token || "nenhum"}`)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Obter os dados do webhook
    let webhookData
    try {
      webhookData = await request.json()
      console.log("Dados do webhook recebidos:", JSON.stringify(webhookData, null, 2))
    } catch (e) {
      console.error("Erro ao processar JSON do webhook:", e)
      return NextResponse.json({ error: "Formato de dados inválido" }, { status: 400 })
    }

    // Verificar se é um evento de pagamento
    const isPaymentEvent =
      webhookData.event === "payment.confirmed" ||
      webhookData.event === "payment.approved" ||
      webhookData.event === "payment_confirmed" ||
      webhookData.event === "payment_approved"

    if (!isPaymentEvent) {
      console.log(`Evento ignorado: ${webhookData.event}`)
      return NextResponse.json({
        success: true,
        message: "Evento recebido, mas não processado (não é um evento de pagamento)",
      })
    }

    // Extrair o ID da página de várias possíveis localizações
    const pageId =
      webhookData?.customData?.pageId ||
      webhookData?.reference ||
      webhookData?.ref ||
      webhookData?.metadata?.pageId ||
      webhookData?.metadata?.ref ||
      webhookData?.id

    if (!pageId) {
      console.error("ID da página não encontrado nos dados do webhook")
      return NextResponse.json(
        {
          error: "ID da página não encontrado",
          webhookData,
        },
        { status: 400 },
      )
    }

    console.log(`ID da página encontrado: ${pageId}`)

    // Buscar os dados da página no Supabase
    const pageData = await getPageById(pageId)

    if (!pageData) {
      console.error(`Página não encontrada no Supabase: ${pageId}`)
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
    }

    console.log(`Página encontrada no Supabase: ${pageData.couple_names}`)

    // Atualizar o status de pagamento para "paid"
    await updatePaymentStatus(pageId, "paid")
    console.log(`Status de pagamento atualizado para 'paid' para a página ${pageId}`)

    // Enviar email de confirmação
    try {
      // Determinar a URL base para a API
      const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://seu-site.vercel.app"
      const emailApiUrl = `${origin}/api/send-email`

      console.log(`Enviando email de confirmação via: ${emailApiUrl}`)

      const emailResponse = await fetch(emailApiUrl, {
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
        throw new Error(`Resposta da API de email não foi ok: ${emailResponse.status}`)
      }

      const emailResult = await emailResponse.json()

      if (emailResult.success) {
        console.log("Email de confirmação enviado com sucesso!")
      } else {
        console.error("Erro ao enviar email de confirmação:", emailResult.error)
      }
    } catch (emailError) {
      console.error("Erro ao enviar email de confirmação:", emailError)
      // Continuamos o processamento mesmo se o email falhar
    }

    return NextResponse.json({
      success: true,
      message: "Status de pagamento atualizado com sucesso",
      pageId,
      coupleName: pageData.couple_names,
    })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json(
      {
        error: "Erro interno",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
