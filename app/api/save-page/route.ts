import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const formData = await request.json()
    console.log("Dados recebidos:", formData)

    // Gerar ID único para a página
    const pageId = uuidv4()

    // Construir URL da página
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://amoremcodigo.com.br"
    const pageUrl = `${baseUrl}/pagina/${pageId}`
    const qrCodeUrl = `${baseUrl}/qr-code?id=${pageId}`

    // Preparar dados para salvar no banco
    const pageData = {
      page_id: pageId,
      couple_names: formData.coupleNames,
      message: formData.message,
      email: formData.email,
      phone: formData.phone,
      page_url: pageUrl,
      qr_code_url: qrCodeUrl,
      payment_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      template: formData.template || "default",
      background_color: formData.backgroundColor || "#ffffff",
      text_color: formData.textColor || "#000000",
      font_family: formData.fontFamily || "Inter",
      image_url: formData.imageUrl || null,
      music_url: formData.musicUrl || null,
      custom_domain: null,
      is_active: true,
    }

    // Salvar no banco de dados
    const { error } = await supabase.from("pages").insert([pageData])

    if (error) {
      console.error("Erro ao salvar página:", error)
      return NextResponse.json({ error: "Erro ao salvar página" }, { status: 500 })
    }

    // Enviar email de confirmação - DESATIVADO TEMPORARIAMENTE
    console.log("EMAIL DE PAGAMENTO PENDENTE DESATIVADO - SAVE PAGE")
    // Não enviar o email inicial
    // await sendConfirmationEmail({...pageData, isPending: true})

    return NextResponse.json({
      success: true,
      pageId,
      pageUrl,
      qrCodeUrl,
    })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
