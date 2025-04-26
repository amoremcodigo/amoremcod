import { NextResponse } from "next/server"
import QRCode from "qrcode"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

async function generateQRCode(text: string, pageId: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error(`Failed to generate QR code for page ID ${pageId}:`, error)
    return ""
  }
}

// Certifique-se de que a função está retornando o pageId corretamente
// Adicione logs para depuração

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("Recebendo dados para salvar página:", formData)

    // Validar dados obrigatórios
    if (!formData.coupleNames || !formData.message || !formData.date) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes" }, { status: 400 })
    }

    // Gerar um ID único para a página se não existir
    const pageId = formData.pageId || uuidv4()
    console.log("ID da página:", pageId)

    // Preparar os dados para inserção no Supabase
    const pageData = {
      id: pageId,
      couple_names: formData.coupleNames,
      message: formData.message,
      date: formData.date,
      youtube_url: formData.youtubeUrl || null,
      image_urls: formData.imageUrls || [],
      email: formData.email || null,
      plan: formData.plan || "basic",
      page_url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/pagina/${pageId}`,
      created_at: new Date().toISOString(),
      payment_status: "pending",
    }

    // Gerar QR Code
    const qrCodeUrl = await generateQRCode(pageData.page_url, pageId)
    pageData.qr_code_url = qrCodeUrl

    console.log("Dados preparados para inserção:", pageData)

    // Inserir no Supabase
    const { data, error } = await supabase.from("pages").upsert(pageData).select()

    if (error) {
      console.error("Erro ao salvar no Supabase:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Página salva com sucesso:", data)

    // Enviar email com QR Code (apenas para visualização, pagamento ainda pendente)
    if (formData.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            pageUrl: pageData.page_url,
            coupleNames: formData.coupleNames,
            qrCodeUrl: qrCodeUrl,
            isPending: true, // Pagamento ainda pendente
          }),
        })
        console.log("Email de visualização enviado com sucesso")
      } catch (emailError) {
        console.error("Erro ao enviar email de visualização:", emailError)
        // Não falhar o processo se o email falhar
      }
    }

    return NextResponse.json({
      success: true,
      pageId: pageId,
      pageUrl: pageData.page_url,
      qrCodeUrl: qrCodeUrl,
    })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
