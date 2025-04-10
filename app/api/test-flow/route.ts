import { NextResponse } from "next/server"
import { savePage, updatePaymentStatus } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // Extrair dados do corpo da requisição
    const formData = await request.json()

    // Gerar um ID de página de teste
    const pageId = `test-${Math.random().toString(36).substring(2, 8)}`

    // Simular o salvamento da página
    console.log("Salvando página de teste no Supabase...")

    // Preparar os dados da página
    const pageData = {
      page_id: pageId,
      email: formData.email || "teste@exemplo.com",
      couple_names: formData.coupleNames || "Casal Teste",
      date: formData.date || "2023-01-01",
      time: formData.time || "12:00",
      message: formData.message || "Mensagem de teste",
      youtube_link: formData.youtubeLink || "",
      photo_urls: formData.photoUrls || [],
      plan: formData.plan || "basic",
      page_url: `https://${request.headers.get("host")}/pagina/${pageId}`,
      qr_code_url: formData.qrCodeUrl || "",
    }

    // Salvar a página no Supabase
    const savedPage = await savePage(pageData)

    // Simular o webhook de pagamento confirmado (opcional)
    if (formData.simulatePayment) {
      console.log("Simulando confirmação de pagamento...")
      await updatePaymentStatus(pageId, "paid")
    }

    return NextResponse.json({
      success: true,
      message: "Fluxo de teste concluído com sucesso!",
      pageId,
      savedPage,
    })
  } catch (error) {
    console.error("Erro no fluxo de teste:", error)
    return NextResponse.json(
      {
        error: "Erro no fluxo de teste",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
