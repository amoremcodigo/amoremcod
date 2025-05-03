import { NextResponse } from "next/server"
import { savePage } from "@/lib/supabase"
import { sendConfirmationEmail } from "@/lib/email"
import { createPayment } from "@/lib/neonpay"

export async function POST(request: Request) {
  console.log("=== INICIANDO ROTA DE SALVAR PÁGINA ===")

  try {
    const data = await request.json()
    console.log("Dados recebidos:", JSON.stringify(data))

    // Verificar se os dados necessários foram fornecidos
    if (!data.page_id || !data.email || !data.couple_names || !data.message || !data.photo_urls || !data.plan) {
      console.error("Dados incompletos:", data)
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Construir a URL da página
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pretaamoremcodigo.com.br"
    const pageUrl = `${siteUrl}/pagina/${data.page_id}`

    // Adicionar a URL da página aos dados
    data.page_url = pageUrl

    // Definir o status de pagamento como pendente
    data.payment_status = "pending"

    console.log("Salvando página no Supabase...")
    // Salvar a página no Supabase
    const saveResult = await savePage(data)

    if (!saveResult.success) {
      console.error("Erro ao salvar página:", saveResult.error)
      return NextResponse.json({ error: "Erro ao salvar página", details: saveResult.error }, { status: 500 })
    }

    console.log("Página salva com sucesso!")

    // Criar o pagamento na Neon Pay
    console.log("Criando pagamento na Neon Pay...")
    const paymentResult = await createPayment(data.page_id, data.plan, {
      name: data.couple_names,
      email: data.email,
      phone: data.phone || "",
    })

    // Enviar email de confirmação pendente
    console.log("Enviando email de confirmação pendente...")
    await sendConfirmationEmail({
      ...data,
      payment_status: "pending",
    })

    return NextResponse.json({
      success: true,
      page_id: data.page_id,
      page_url: pageUrl,
      checkout_url: paymentResult.checkout_url,
    })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
