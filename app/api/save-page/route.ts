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
        { error: "Dados incompletos", details: "ID da página, email e nome do casal são obrigatórios" },
        { status: 400 },
      )
    }

    // Remover explicitamente o campo time se estiver presente
    if (pageData.time) {
      delete pageData.time
      console.log("Campo 'time' removido dos dados")
    }

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

    // Remover explicitamente created_at se estiver presente
    if (pageData.created_at) {
      delete pageData.created_at
    }

    // Salvar no Supabase com timeout
    console.log("Salvando página no Supabase...")

    // Criar uma promise com timeout para o salvamento
    const saveWithTimeout = async (timeout = 10000) => {
      let timeoutId: NodeJS.Timeout

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Timeout de ${timeout}ms excedido ao salvar no Supabase`))
        }, timeout)
      })

      try {
        const savePromise = savePage(pageData)
        const result = await Promise.race([savePromise, timeoutPromise])
        clearTimeout(timeoutId)
        return result
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }

    try {
      const result = await saveWithTimeout()
      console.log("Resultado do salvamento:", result)

      if (!result || !result.success) {
        throw new Error("Falha ao salvar no Supabase: resposta inválida")
      }
    } catch (saveError) {
      console.error("Erro ao salvar no Supabase:", saveError)

      // Tentar novamente uma vez antes de falhar
      try {
        console.log("Tentando salvar novamente...")
        const retryResult = await saveWithTimeout(15000) // Timeout maior na segunda tentativa

        if (!retryResult || !retryResult.success) {
          throw new Error("Falha ao salvar no Supabase na segunda tentativa")
        }

        console.log("Salvamento bem-sucedido na segunda tentativa")
      } catch (retryError) {
        console.error("Erro na segunda tentativa de salvamento:", retryError)
        return NextResponse.json(
          {
            success: false,
            error: "Erro ao salvar no Supabase",
            details: retryError instanceof Error ? retryError.message : String(retryError),
          },
          { status: 500 },
        )
      }
    }

    // Determinar URL de checkout com base no plano
    const checkoutUrl =
      pageData.plan === "premium" ? "https://pay.kiwify.com.br/MN5HRnF" : "https://pay.kiwify.com.br/x7zu8ul"

    // Adicionar referência do ID da página
    const checkoutUrlWithRef = `${checkoutUrl}?ref=${pageData.page_id}`

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
        })
        console.log("Email enviado com sucesso!")
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError)
        // Continuar mesmo com erro no email
      }
    }, 0)

    return NextResponse.json({
      success: true,
      message: "Página salva com sucesso",
      pageId: pageData.page_id,
      checkoutUrl: checkoutUrlWithRef,
    })
  } catch (error) {
    console.error("Erro ao salvar página:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao salvar página",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
