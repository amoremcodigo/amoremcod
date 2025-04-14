import { NextResponse } from "next/server"
import { updatePaymentStatus, getPageById } from "@/lib/supabase"

export async function POST(request: Request) {
  console.log("=== WEBHOOK DA KIWIFY RECEBIDO ===")
  console.log("URL completa:", request.url)

  try {
    // Extrair a referência da URL (fallback)
    const url = new URL(request.url)
    const urlReference = url.searchParams.get("reference") || url.searchParams.get("ref")

    // Obter o corpo da requisição como texto bruto
    const rawBody = await request.text()
    console.log("Corpo bruto da requisição (primeiros 200 caracteres):", rawBody.substring(0, 200))

    // Tentar analisar como JSON
    let webhookData: any = {}
    try {
      webhookData = JSON.parse(rawBody)
      console.log("Dados do webhook (completo):", webhookData)
    } catch (e) {
      console.log("O corpo não é JSON válido, usando como texto bruto")
    }

    // FORMATO REAL DA KIWIFY:
    // {
    //   "order_id": "dcf5fb8c-e611-4d1d-9b6a-abe89d39054c",
    //   "order_ref": "ItTftqU",
    //   "order_status": "paid",
    //   ...
    // }

    // Extrair a referência do webhook (formato real da Kiwify)
    let reference = webhookData.order_ref || null

    // Extrair o status do pagamento (formato real da Kiwify)
    let status = webhookData.order_status || "pending"

    // Fallbacks para outros formatos possíveis
    if (!reference) {
      // Tentar outros formatos possíveis
      reference =
        webhookData.reference || webhookData.data?.order?.reference || webhookData.order?.reference || urlReference
    }

    if (status === "pending") {
      // Tentar outros formatos possíveis
      status =
        webhookData.status ||
        webhookData.data?.order?.status ||
        webhookData.order?.status ||
        url.searchParams.get("status") ||
        "pending"
    }

    console.log(`Referência extraída: ${reference}`)
    console.log(`Status extraído: ${status}`)

    // Se não encontramos uma referência, retornar erro
    if (!reference) {
      console.error("Referência não encontrada nos dados do webhook")
      return NextResponse.json(
        {
          error: "Referência não encontrada nos dados do webhook",
          webhookData,
        },
        { status: 400 },
      )
    }

    // Atualizar o status de pagamento no Supabase
    console.log(`Atualizando status de pagamento para ${reference}: ${status}`)
    await updatePaymentStatus(reference, status)

    // Se o pagamento foi aprovado, enviar o email com o QR Code
    if (status === "approved" || status === "paid") {
      console.log(`Pagamento aprovado para página ${reference}, enviando email...`)

      // Buscar os dados da página no Supabase
      const pageData = await getPageById(reference)

      if (!pageData) {
        console.error(`Página ${reference} não encontrada`)
        return NextResponse.json({
          success: true,
          message: "Status atualizado, mas página não encontrada",
          reference,
          status,
        })
      }

      // Enviar o email com o QR Code
      try {
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
          console.error(`Erro ao enviar email: ${emailResponse.status}`)
        } else {
          console.log(`Email enviado com sucesso para ${pageData.email}`)
        }
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError)
        // Continuar mesmo com erro no email
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      reference,
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

// Adicionar suporte para GET para facilitar testes
export async function GET(request: Request) {
  console.log("=== WEBHOOK DA KIWIFY RECEBIDO VIA GET ===")
  return POST(request)
}
