import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { sendEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const data = await request.json()

    // Verificar se já existe uma página com o mesmo slug
    const { data: existingPage, error: checkError } = await supabase
      .from("pages")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle()

    if (checkError) {
      console.error("Erro ao verificar slug existente:", checkError)
      return NextResponse.json({ error: "Erro ao verificar disponibilidade do slug" }, { status: 500 })
    }

    if (existingPage) {
      return NextResponse.json({ error: "Este link já está em uso. Por favor, escolha outro." }, { status: 400 })
    }

    // Inserir a nova página
    const { data: page, error } = await supabase
      .from("pages")
      .insert([
        {
          title: data.title,
          slug: data.slug,
          recipient_name: data.recipientName,
          sender_name: data.senderName,
          message: data.message,
          email: data.email,
          phone: data.phone,
          youtube_url: data.youtubeUrl || null,
          date: data.date || null,
          plan: data.plan || "basic",
          status: "pending",
          image_urls: data.imageUrls || [],
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erro ao salvar página:", error)
      return NextResponse.json({ error: "Erro ao salvar página" }, { status: 500 })
    }

    // Enviar email de confirmação
    try {
      await sendEmail({
        to: data.email,
        subject: "Seu site de declaração de amor foi criado!",
        text: `Olá ${data.senderName}!\n\nSeu site de declaração de amor para ${data.recipientName} foi criado com sucesso!\n\nAcesse: ${process.env.NEXT_PUBLIC_SITE_URL}/pagina/${data.slug}\n\nObrigado por usar nosso serviço!\n\nEquipe Amor em Código`,
        html: `
          <h1>Olá ${data.senderName}!</h1>
          <p>Seu site de declaração de amor para ${data.recipientName} foi criado com sucesso!</p>
          <p>Acesse: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/pagina/${data.slug}">${process.env.NEXT_PUBLIC_SITE_URL}/pagina/${data.slug}</a></p>
          <p>Obrigado por usar nosso serviço!</p>
          <p>Equipe Amor em Código</p>
        `,
      })
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError)
      // Não retornamos erro aqui para não interromper o fluxo
    }

    // Revalidar o caminho da página
    revalidatePath(`/pagina/${data.slug}`)

    // Determinar URL de checkout com base no plano
    let checkoutUrl = ""

    if (data.plan === "premium") {
      checkoutUrl = "https://checkout.neonpay.com.br/checkout/cma699jmn02tgt4xjw8nyh7vh?offer=FO0XZT0"
    } else {
      checkoutUrl = "https://checkout.neonpay.com.br/checkout/cma699jmn02tgt4xjw8nyh7vh?offer=ZSC4E0P"
    }

    // Adicionar parâmetros ao URL de checkout
    const finalCheckoutUrl = `${checkoutUrl}&external_reference=${page.id}&buyer_name=${encodeURIComponent(data.senderName)}&buyer_email=${encodeURIComponent(data.email)}&buyer_phone=${encodeURIComponent(data.phone || "")}&redirect_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/obrigado?page_id=${page.id}`)}`

    return NextResponse.json({
      success: true,
      page_id: page.id,
      checkout_url: finalCheckoutUrl,
    })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
