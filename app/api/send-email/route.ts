// Vamos modificar a rota de envio de email para remover a parte mencionada do email pendente

import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email, pageUrl, coupleNames, qrCodeUrl, isPending } = await request.json()

    // Verificar se os dados necessários foram fornecidos
    if (!email || !pageUrl || !coupleNames) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Construir o assunto do email
    const subject = isPending
      ? "Seu pedido foi recebido - Preta Amor em Código"
      : "Sua página de amor está pronta! - Preta Amor em Código"

    // Construir o conteúdo HTML do email
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo-icon.png" alt="Preta Amor em Código" style="width: 100px; height: auto;" />
        </div>
        <h1 style="color: #e11d48; text-align: center; margin-bottom: 20px;">
          ${isPending ? "Seu pedido foi recebido!" : "Sua página de amor está pronta!"}
        </h1>
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          Olá,
        </p>
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          ${
            isPending
              ? `Recebemos seu pedido para a criação da página de amor para <strong>${coupleNames}</strong>. Estamos aguardando a confirmação do seu pagamento para liberar o acesso à sua página personalizada.`
              : `Sua página de amor para <strong>${coupleNames}</strong> está pronta! Você já pode compartilhar o link ou o QR Code com quem você ama.`
          }
        </p>
    `

    // Adicionar o botão de acesso à página APENAS se NÃO for um email pendente
    if (!isPending) {
      htmlContent += `
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          Você pode acessar sua página através do link abaixo:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${pageUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Acessar Minha Página
          </a>
        </div>
      `

      // Adicionar o QR Code se disponível
      if (qrCodeUrl) {
        htmlContent += `
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px; text-align: center;">
            Ou escaneie o QR Code abaixo:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: auto; border: 1px solid #ddd; padding: 10px;" />
          </div>
        `
      }
    }

    // Finalizar o conteúdo do email
    htmlContent += `
        <p style="font-size: 16px; line-height: 1.5; margin-top: 30px;">
          Com amor,<br />
          Equipe Preta Amor em Código
        </p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Preta Amor em Código. Todos os direitos reservados.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/termos" style="color: #777; text-decoration: underline;">Termos de Uso</a> | 
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/privacidade" style="color: #777; text-decoration: underline;">Política de Privacidade</a>
          </p>
        </div>
      </div>
    `

    // Configurar os dados do email
    const mailData = {
      to: [
        {
          email: email,
          name: coupleNames,
        },
      ],
      from: {
        email: "contato@pretaamoremcodigo.com.br",
        name: "Preta Amor em Código",
      },
      subject: subject,
      html: htmlContent,
    }

    // Enviar o email
    const success = await sendEmail(mailData)

    if (!success) {
      return NextResponse.json({ error: "Falha ao enviar o email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
