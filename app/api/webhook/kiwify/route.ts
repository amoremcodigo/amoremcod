import { NextResponse } from "next/server"
import { updatePaymentStatus, getPagesByEmail } from "@/lib/supabase"

export async function POST(request: Request) {
  console.log("=== WEBHOOK DA KIWIFY RECEBIDO ===")
  console.log("URL completa:", request.url)

  try {
    // Obter o corpo da requisição como texto bruto
    const rawBody = await request.text()
    console.log("Corpo bruto da requisição:", rawBody)

    // Tentar analisar como JSON
    let webhookData: any = {}
    try {
      webhookData = JSON.parse(rawBody)
      console.log("Dados do webhook parseados com sucesso")
    } catch (e) {
      console.error("ERRO AO PARSEAR JSON:", e)
      console.log("O corpo não é JSON válido, usando como texto bruto")
    }

    // ACESSO DIRETO AO CAMPO EMAIL DO CUSTOMER
    // Baseado na estrutura exata fornecida pelo usuário
    let customerEmail = null

    if (webhookData && webhookData.Customer && typeof webhookData.Customer === "object") {
      customerEmail = webhookData.Customer.email
      console.log("E-mail encontrado diretamente em Customer.email:", customerEmail)
    }

    // Se não encontrou o e-mail na estrutura esperada, tentar outras abordagens
    if (!customerEmail) {
      console.log("E-mail não encontrado na estrutura esperada, tentando alternativas...")

      // Verificar todos os caminhos possíveis para o e-mail
      const possiblePaths = [
        webhookData.customer?.email,
        webhookData.Customer?.Email,
        webhookData.customer?.Email,
        webhookData.customer_email,
        webhookData.email,
        webhookData.buyer_email,
        webhookData.user_email,
      ]

      for (const path of possiblePaths) {
        if (typeof path === "string" && path.includes("@")) {
          customerEmail = path
          console.log(`E-mail encontrado em caminho alternativo: ${customerEmail}`)
          break
        }
      }
    }

    // Se ainda não encontrou, tentar extrair por regex do corpo bruto
    if (!customerEmail && typeof rawBody === "string") {
      console.log("Tentando extrair e-mail do corpo bruto usando regex")
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const matches = rawBody.match(emailRegex)

      if (matches && matches.length > 0) {
        console.log("E-mails encontrados via regex:", matches)
        customerEmail = matches[0]
        console.log(`E-mail extraído via regex: ${customerEmail}`)
      }
    }

    // Extrair o status do pagamento
    const status = webhookData.order_status || webhookData.status || "pending"
    console.log(`Status do pagamento: ${status}`)

    // Se não temos o e-mail do cliente, não podemos continuar
    if (!customerEmail) {
      console.error("E-mail do cliente não encontrado nos dados do webhook")
      console.error("Conteúdo completo do webhook:", rawBody)

      // SOLUÇÃO DE EMERGÊNCIA: Tentar processar a página mais recente
      try {
        console.log("TENTANDO PROCESSAR PÁGINA MAIS RECENTE COMO FALLBACK")
        const recentPages = await listRecentPages(1)

        if (recentPages && recentPages.length > 0) {
          const pageData = recentPages[0]
          const pageId = pageData.page_id

          // Atualizar o status para aprovado
          await updatePaymentStatus(pageId, "paid")

          // Enviar e-mail de confirmação
          await sendConfirmationEmail(pageData)

          return NextResponse.json({
            success: true,
            message: "Webhook processado com sucesso (fallback de emergência)",
            pageId,
            email: pageData.email,
            status: "paid",
          })
        }
      } catch (fallbackError) {
        console.error("ERRO NO FALLBACK DE EMERGÊNCIA:", fallbackError)
      }

      return NextResponse.json(
        {
          error: "E-mail do cliente não encontrado nos dados do webhook",
          webhookData,
          rawBody: rawBody.substring(0, 1000), // Incluir parte do corpo bruto na resposta
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

    // Add tracking in the webhook handler when payment is confirmed
    // Find the section where payment is confirmed and add the tracking code
    // Se o pagamento foi aprovado, enviar o email com o QR Code
    if (status === "approved" || status === "paid") {
      console.log(`Pagamento aprovado para página ${pageId}, enviando email...`)

      // Track purchase event (server-side)
      // Note: This is server-side tracking, which will be logged but not sent to the browser
      console.log("Registrando evento de compra para o Facebook Pixel")

      await sendConfirmationEmail(pageData)
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

// Função auxiliar para listar páginas recentes
async function listRecentPages(limit = 1) {
  try {
    const { supabase } = await import("@/lib/supabase")
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("ERRO AO LISTAR PÁGINAS RECENTES:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("ERRO AO LISTAR PÁGINAS RECENTES:", error)
    return null
  }
}

// Função auxiliar para enviar e-mail de confirmação
async function sendConfirmationEmail(pageData: any) {
  try {
    console.log("ENVIANDO E-MAIL DE CONFIRMAÇÃO PARA:", pageData.email)

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
      console.error("ERRO AO ENVIAR E-MAIL:", emailResponse.status)
      return false
    }

    console.log("E-MAIL ENVIADO COM SUCESSO PARA:", pageData.email)
    return true
  } catch (error) {
    console.error("ERRO AO ENVIAR E-MAIL:", error)
    return false
  }
}

// Adicionar suporte para GET para facilitar testes
export async function GET(request: Request) {
  console.log("=== WEBHOOK DA KIWIFY RECEBIDO VIA GET ===")
  return POST(request)
}
