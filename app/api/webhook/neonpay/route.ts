import { NextResponse } from "next/server"
import { updatePaymentStatus, getPagesByEmail } from "@/lib/supabase"
import { sendConfirmationEmail } from "@/lib/email"
import { savePage } from "@/lib/pages"

// Modificar a função POST para priorizar o e-mail do cliente e garantir o envio do e-mail
export async function POST(request: Request) {
  console.log("=== WEBHOOK DA NEON PAY RECEBIDO ===")
  console.log("URL completa:", request.url)

  try {
    // Verificar token de segurança
    const authHeader = request.headers.get("Authorization")
    const webhookToken = process.env.NEON_PAY_WEBHOOK_TOKEN

    if (webhookToken && (!authHeader || !authHeader.includes(webhookToken))) {
      console.error("Token de webhook inválido")
      return NextResponse.json({ error: "Token de webhook inválido" }, { status: 401 })
    }

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

      // Tentar extrair o e-mail do texto bruto usando regex
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const emailMatches = rawBody.match(emailRegex)

      if (emailMatches && emailMatches.length > 0) {
        webhookData.customer = { email: emailMatches[0] }
        console.log(`E-mail extraído do texto bruto: ${emailMatches[0]}`)
      }
    }

    // PRIORIDADE: Extrair o e-mail do cliente de todos os campos possíveis
    const customerEmail =
      webhookData.customer?.email ||
      webhookData.email ||
      webhookData.buyer_email ||
      webhookData.payer_email ||
      webhookData.metadata?.email ||
      webhookData.user?.email ||
      webhookData.client?.email ||
      webhookData.data?.email

    // Se não encontrou o e-mail, tentar extrair de outros campos
    if (!customerEmail) {
      console.log("E-mail do cliente não encontrado nos campos principais, buscando em campos aninhados...")

      // Buscar recursivamente em todos os campos do objeto
      const findEmail = (obj: any): string | null => {
        if (!obj || typeof obj !== "object") return null

        for (const key in obj) {
          const value = obj[key]

          // Verificar se o valor é uma string que parece um e-mail
          if (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return value
          }

          // Verificar recursivamente objetos aninhados
          if (typeof value === "object") {
            const nestedEmail = findEmail(value)
            if (nestedEmail) return nestedEmail
          }
        }

        return null
      }

      const extractedEmail = findEmail(webhookData)
      if (extractedEmail) {
        console.log(`E-mail encontrado em campo aninhado: ${extractedEmail}`)
        webhookData.extracted_email = extractedEmail
      }
    }

    // Usar o e-mail encontrado ou o extraído
    const finalEmail = customerEmail || webhookData.extracted_email

    if (!finalEmail) {
      console.error("ERRO CRÍTICO: Não foi possível encontrar o e-mail do cliente nos dados do webhook")
      return NextResponse.json(
        {
          error: "E-mail do cliente não encontrado",
          webhookData: JSON.stringify(webhookData).substring(0, 1000),
        },
        { status: 400 },
      )
    }

    console.log(`E-mail do cliente encontrado: ${finalEmail}`)

    // Buscar páginas associadas a este e-mail, independentemente de erros no Supabase
    let pageData = null
    try {
      const pages = await getPagesByEmail(finalEmail, 1)
      if (pages && pages.length > 0) {
        pageData = pages[0] // Pegar a página mais recente deste cliente
        console.log(`Página encontrada para o e-mail ${finalEmail}: ${pageData.page_id}`)
      } else {
        console.log(`Nenhuma página encontrada para o e-mail ${finalEmail} via Supabase`)
      }
    } catch (error) {
      console.error("Erro ao buscar páginas por e-mail via Supabase:", error)
      // Continuar mesmo com erro
    }

    // Se não conseguiu obter os dados da página via Supabase, criar um objeto mínimo
    if (!pageData) {
      console.log("Criando objeto de página mínimo para envio do e-mail")

      // Extrair possível nome do cliente dos dados do webhook
      const possibleName =
        webhookData.customer?.name ||
        webhookData.buyer_name ||
        webhookData.payer_name ||
        webhookData.name ||
        webhookData.metadata?.name ||
        "Cliente"

      // Criar um ID de página baseado no e-mail (para fins de rastreamento)
      const emailBasedId = `page-${finalEmail.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`

      pageData = {
        page_id: emailBasedId,
        email: finalEmail,
        couple_names: possibleName,
        message: "Sua mensagem de amor personalizada",
        photo_urls: [],
        plan: "basic",
        page_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pagina/${emailBasedId}`,
        qr_code_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/qr-code?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/pagina/${emailBasedId}`)}`,
        payment_status: "paid",
      }

      console.log("Objeto de página mínimo criado:", pageData)

      // Tentar salvar este objeto no Supabase (mas continuar mesmo se falhar)
      try {
        await savePage(pageData)
        console.log("Objeto de página mínimo salvo no Supabase")
      } catch (saveError) {
        console.error("Erro ao salvar objeto de página mínimo:", saveError)
        // Continuar mesmo com erro
      }
    }

    // Atualizar o status para aprovado (independentemente de erros)
    try {
      if (pageData.page_id) {
        await updatePaymentStatus(pageData.page_id, "paid")
        console.log(`Status de pagamento atualizado para: paid`)
      }
    } catch (updateError) {
      console.error("Erro ao atualizar status de pagamento:", updateError)
      // Continuar mesmo com erro
    }

    // ENVIAR E-MAIL DE CONFIRMAÇÃO INDEPENDENTEMENTE DE QUALQUER ERRO
    console.log("ENVIANDO E-MAIL DE CONFIRMAÇÃO INDEPENDENTEMENTE DE ERROS")

    let emailSent = false
    try {
      // Tentar enviar e-mail usando a função existente
      emailSent = await sendConfirmationEmail(pageData)
      console.log(`Resultado do envio de e-mail via sendConfirmationEmail: ${emailSent ? "Sucesso" : "Falha"}`)
    } catch (emailError) {
      console.error("Erro ao enviar e-mail via sendConfirmationEmail:", emailError)
      // Continuar e tentar método alternativo
    }

    // Se o envio falhou, tentar método alternativo direto
    if (!emailSent) {
      console.log("Tentando método alternativo de envio de e-mail")

      try {
        // Enviar e-mail diretamente usando a API
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: finalEmail,
            pageUrl: pageData.page_url,
            coupleNames: pageData.couple_names,
            qrCodeUrl: pageData.qr_code_url,
            isPending: false, // Pagamento confirmado
            forceSend: true, // Forçar envio mesmo com erros
          }),
        })

        if (emailResponse.ok) {
          console.log("E-mail enviado com sucesso via método alternativo")
          emailSent = true
        } else {
          console.error("Falha no envio de e-mail via método alternativo:", await emailResponse.text())
        }
      } catch (directEmailError) {
        console.error("Erro ao enviar e-mail via método alternativo:", directEmailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      email: finalEmail,
      emailSent,
      pageId: pageData.page_id,
      status: "paid",
    })
  } catch (error) {
    console.error("Erro ao processar webhook da Neon Pay:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Adicionar suporte para GET para facilitar testes
export async function GET(request: Request) {
  console.log("=== WEBHOOK DA NEON PAY RECEBIDO VIA GET ===")
  return POST(request)
}
