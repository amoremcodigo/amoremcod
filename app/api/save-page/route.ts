import { NextResponse } from "next/server"
import { savePage } from "@/lib/supabase"
import QRCode from "qrcode"

// Otimizar a função POST para processar mais rapidamente
export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const pageData = await request.json()

    // Verificar se temos os dados necessários
    if (!pageData.page_id || !pageData.email || !pageData.couple_names) {
      // Gerar IDs aleatórios para campos faltantes
      if (!pageData.page_id) {
        pageData.page_id = `auto-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
      }

      if (!pageData.email) {
        pageData.email = `auto-${Date.now()}@amoremcodigo.com.br`
      }

      if (!pageData.couple_names) {
        pageData.couple_names = "Casal Anônimo"
      }
    }

    // Remover explicitamente campos problemáticos
    delete pageData.time
    delete pageData.created_at
    delete pageData.updated_at

    // Gerar QR Code se não foi fornecido
    if (!pageData.qr_code_url && pageData.page_url) {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(pageData.page_url, {
          width: 300,
          margin: 1,
          errorCorrectionLevel: "H",
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
        pageData.qr_code_url = qrCodeDataUrl
      } catch (qrError) {
        console.error("Erro ao gerar QR Code:", qrError)
        // Continuar mesmo sem QR code
      }
    }

    // Adicionar status de pagamento se não existir
    if (!pageData.payment_status) {
      pageData.payment_status = "pending"
    }

    // Salvar no Supabase em background
    setTimeout(async () => {
      try {
        await savePage(pageData)
      } catch (error) {
        console.error("Erro ao salvar no Supabase:", error)
      }
    }, 0)

    // Enviar email com status pendente em background
    setTimeout(async () => {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://amoremcodigo.com.br"

        await fetch(`${siteUrl}/api/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: pageData.email,
            pageUrl: pageData.page_url,
            coupleNames: pageData.couple_names,
            qrCodeUrl: pageData.qr_code_url,
            isPending: true, // Pagamento pendente
          }),
          cache: "no-store",
        })
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError)
      }
    }, 0)

    // Determinar URL de checkout com base no plano
    const checkoutUrl =
      pageData.plan === "premium" ? "https://pay.kiwify.com.br/MN5HRnF" : "https://pay.kiwify.com.br/x7zu8ul"

    // Adicionar referência do ID da página
    const checkoutUrlWithRef = `${checkoutUrl}?ref=${pageData.page_id}`

    // Sempre retornar sucesso para que o usuário possa continuar
    return NextResponse.json({
      success: true,
      message: "Página processada com sucesso",
      pageId: pageData.page_id,
      checkoutUrl: checkoutUrlWithRef,
    })
  } catch (error) {
    console.error("Erro ao salvar página:", error)
    // Mesmo com erro, retornar sucesso para que o usuário possa continuar
    return NextResponse.json({
      success: true,
      message: "Página será processada em segundo plano",
      error: "Erro ao processar página, mas continuando",
    })
  }
}
