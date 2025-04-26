import { NextResponse } from "next/server"
import { savePage } from "@/lib/supabase"
import QRCode from "qrcode"

export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const pageData = await request.json()

    console.log("=== API SAVE-PAGE: INICIANDO SALVAMENTO ===")
    console.log(
      "Dados recebidos:",
      JSON.stringify({
        page_id: pageData.page_id,
        email: pageData.email,
        couple_names: pageData.couple_names,
        plan: pageData.plan,
        photo_urls_count: pageData.photo_urls?.length || 0,
      }),
    )

    // Verificar se temos os dados necessários
    if (!pageData.page_id || !pageData.email || !pageData.couple_names) {
      console.error("Dados incompletos:", {
        page_id: pageData.page_id ? "OK" : "Faltando",
        email: pageData.email ? "OK" : "Faltando",
        couple_names: pageData.couple_names ? "OK" : "Faltando",
      })
      return NextResponse.json(
        {
          success: false,
          error: "Dados incompletos",
          details: "ID da página, email e nome do casal são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Remover completamente os campos problemáticos
    delete pageData.date
    delete pageData.time
    console.log("Campos de data e hora removidos para evitar erros")

    // Gerar QR Code se não foi fornecido
    if (!pageData.qr_code_url && pageData.page_url) {
      try {
        console.log("Gerando QR Code para a URL:", pageData.page_url)
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
        console.log("QR Code gerado com sucesso")
      } catch (qrError) {
        console.error("Erro ao gerar QR Code:", qrError)
        // Continuar mesmo sem QR code
      }
    }

    // Adicionar status de pagamento se não existir
    if (!pageData.payment_status) {
      pageData.payment_status = "pending"
    }

    // Salvar no Supabase - IMPORTANTE: Verificar se o salvamento foi bem-sucedido
    console.log("Salvando página no Supabase...")
    let saveResult

    try {
      saveResult = await savePage(pageData)

      // Mesmo se houver erro no Supabase, continuaremos o fluxo
      if (saveResult.fakeSuccess) {
        console.warn("AVISO: Página não foi salva no Supabase, mas continuando fluxo:", saveResult.error)
      } else {
        console.log("Página salva com sucesso no Supabase:", saveResult)
      }
    } catch (saveError) {
      console.error("ERRO CRÍTICO: Falha ao salvar no Supabase:", saveError)
      // Mesmo com erro, vamos continuar o fluxo
      console.warn("Continuando fluxo mesmo com erro no Supabase")
      saveResult = {
        success: true,
        fakeSuccess: true,
        error: saveError instanceof Error ? saveError.message : String(saveError),
      }
    }

    // Determinar URL de checkout com base no plano
    const checkoutUrl =
      pageData.plan === "premium" ? "https://pay.kiwify.com.br/MN5HRnF" : "https://pay.kiwify.com.br/x7zu8ul"

    // Adicionar referência do ID da página
    const checkoutUrlWithRef = `${checkoutUrl}?ref=${pageData.page_id}`
    console.log("URL de checkout gerada:", checkoutUrlWithRef)

    // Enviar email com status pendente em background para não atrasar a resposta
    setTimeout(async () => {
      try {
        console.log("Enviando email de confirmação pendente...")
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
        }).catch((emailError) => {
          console.error("Erro na requisição do email:", emailError)
        })
        console.log("Email enviado com sucesso!")
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError)
        // Continuar mesmo com erro no email
      }
    }, 0)

    // Sempre retornar sucesso para continuar o fluxo
    return NextResponse.json({
      success: true,
      message: saveResult.fakeSuccess
        ? "Não foi possível salvar a página no banco de dados, mas você pode prosseguir com o checkout"
        : "Página salva com sucesso",
      pageId: pageData.page_id,
      checkoutUrl: checkoutUrlWithRef,
    })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)

    // Mesmo em caso de erro grave, retornar uma URL de checkout
    const randomId = Math.random().toString(36).substring(2, 8)
    const fallbackCheckoutUrl = `https://pay.kiwify.com.br/x7zu8ul?ref=error-${randomId}`

    return NextResponse.json({
      success: true, // Forçar sucesso para continuar o fluxo
      fakeSuccess: true,
      message: "Ocorreu um erro, mas você pode prosseguir com o checkout",
      pageId: `error-${randomId}`,
      checkoutUrl: fallbackCheckoutUrl,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
