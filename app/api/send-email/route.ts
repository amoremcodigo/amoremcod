import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email, pageUrl, coupleNames, qrCodeUrl, isPending } = await request.json()

    // Verificar se é o email de pagamento pendente e desativá-lo
    if (isPending === true) {
      console.log("EMAIL DE PAGAMENTO PENDENTE DESATIVADO - ROTA API")
      return NextResponse.json({ success: true, message: "Email de pagamento pendente desativado temporariamente" })
    }

    // Preparar dados do email
    const subject = isPending
      ? `Aguardando confirmação de pagamento - Amor em Código`
      : `Sua página de amor está pronta! - Amor em Código`

    const htmlContent = isPending
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #e91e63; text-align: center;">Amor em Código</h1>
        <h2 style="text-align: center;">Aguardando confirmação de pagamento</h2>
        <p>Olá ${coupleNames},</p>
        <p>Recebemos seu pedido e estamos aguardando a confirmação do pagamento.</p>
        <p>Assim que o pagamento for confirmado, você receberá um email com o link da sua página personalizada e o QR Code.</p>
        <p>Se você já realizou o pagamento, aguarde alguns instantes para a confirmação.</p>
        <p>Em caso de dúvidas, entre em contato conosco pelo WhatsApp: (11) 97749-2941</p>
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin-bottom: 5px;">Atenciosamente,</p>
          <p style="font-weight: bold; color: #e91e63;">Equipe Amor em Código</p>
        </div>
      </div>
    `
      : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #e91e63; text-align: center;">Amor em Código</h1>
        <h2 style="text-align: center;">Sua página de amor está pronta!</h2>
        <p>Olá ${coupleNames},</p>
        <p>Seu pagamento foi confirmado e sua página de amor está pronta!</p>
        <p>Acesse sua página personalizada através do link abaixo:</p>
        <p style="text-align: center;">
          <a href="${pageUrl}" style="display: inline-block; background-color: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Minha Página</a>
        </p>
        <p>Você também pode acessar sua página através do QR Code abaixo:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${qrCodeUrl}" style="display: inline-block; background-color: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Meu QR Code</a>
        </div>
        <p>Compartilhe o link ou o QR Code com quem você ama e surpreenda!</p>
        <p>Em caso de dúvidas, entre em contato conosco pelo WhatsApp: (11) 97749-2941</p>
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin-bottom: 5px;">Atenciosamente,</p>
          <p style="font-weight: bold; color: #e91e63;">Equipe Amor em Código</p>
        </div>
      </div>
    `

    // Configurar dados para o MailerSend
    const mailData = {
      from: {
        email: "contato@amoremcodigo.com.br",
        name: "Amor em Código",
      },
      to: [
        {
          email: email,
          name: coupleNames,
        },
      ],
      subject: subject,
      html: htmlContent,
    }

    // Enviar email
    const success = await sendEmail(mailData)

    if (!success) {
      return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
