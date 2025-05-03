import { NextResponse } from "next/server"
import { getPageById, updatePaymentStatus } from "@/lib/supabase"
import { sendConfirmationEmail } from "@/lib/email"

export async function GET(request: Request) {
  try {
    // Obter o ID da página da query string
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get("pageId")

    if (!pageId) {
      return NextResponse.json({ error: "ID da página não fornecido" }, { status: 400 })
    }

    console.log(`Verificando status de pagamento para a página: ${pageId}`)

    // Buscar a página no Supabase
    const pageData = await getPageById(pageId)

    if (!pageData) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
    }

    // Verificar se o pagamento já está aprovado
    if (pageData.payment_status === "paid" || pageData.payment_status === "approved") {
      return NextResponse.json({
        success: true,
        pageId,
        status: pageData.payment_status,
        message: "Pagamento já aprovado",
      })
    }

    // Aqui você faria uma chamada para a API da Neon Pay para verificar o status
    // Como não temos acesso direto à API, vamos simular uma verificação

    // Para fins de demonstração, vamos aprovar o pagamento
    // Em produção, você deve implementar a verificação real com a API da Neon Pay
    const newStatus = "paid"

    // Atualizar o status no Supabase
    await updatePaymentStatus(pageId, newStatus)

    // Se o pagamento foi aprovado, enviar o email com o QR Code
    if (newStatus === "paid" || newStatus === "approved") {
      await sendConfirmationEmail(pageData)
    }

    return NextResponse.json({
      success: true,
      pageId,
      status: newStatus,
      message: "Status de pagamento atualizado",
    })
  } catch (error) {
    console.error("Erro ao verificar status de pagamento:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
