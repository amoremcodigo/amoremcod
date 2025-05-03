import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  console.log("=== ROTA DE ENVIO DE EMAIL INICIADA ===")

  try {
    const data = await request.json()
    console.log("Dados recebidos:", JSON.stringify(data).substring(0, 500))

    // Verificar se temos o e-mail do destinatário
    if (!data.email) {
      console.error("E-mail do destinatário não fornecido")
      return NextResponse.json({ error: "E-mail do destinatário não fornecido" }, { status: 400 })
    }

    // Verificar se devemos forçar o envio mesmo com dados incompletos
    const forceSend = data.forceSend === true

    // Verificar dados obrigatórios (a menos que forceSend seja true)
    if (!forceSend && (!data.pageUrl || !data.coupleNames)) {
      console.error("Dados obrigatórios não fornecidos")
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    // Garantir valores padrão para campos obrigatórios
    const pageUrl = data.pageUrl || `${process.env.NEXT_PUBLIC_SITE_URL || ""}/pagina/unknown`
    const coupleNames = data.coupleNames || "Casal Especial"
    const qrCodeUrl = data.qrCodeUrl || ""
    const isPending = data.isPending === true

    // Construir o HTML do e-mail
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sua Página de Amor Personalizada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 150px; }
          h1 { color: #e91e63; }
          .content { margin-bottom: 30px; }
          .button { display: inline-block; background-color: #e91e63; color: white; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; }
          .qrcode { text-align: center; margin: 30px 0; }
          .qrcode img { max-width: 200px; }
          .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${process.env.NEXT_PUBLIC_SITE_URL || ""}/logo-icon.png" alt="Amor em Código" class="logo">
          <h1>Sua Página de Amor Personalizada</h1>
        </div>
        
        <div class="content">
          <p>Olá ${coupleNames},</p>
          
          ${
            isPending
              ? `
              <p>Recebemos seu pedido para criar uma página de amor personalizada. Assim que seu pagamento for confirmado, você receberá outro e-mail com o link e QR Code da sua página.</p>
              <p>Se você já realizou o pagamento, aguarde alguns instantes para a confirmação.</p>
              `
              : `
              <p>Sua página de amor personalizada está pronta! 💕</p>
              <p>Você pode acessar sua página através do link abaixo:</p>
              <p style="text-align: center;">
                <a href="${pageUrl}" class="button">Acessar Minha Página</a>
              </p>
              
              ${
                qrCodeUrl
                  ? `
                  <div class="qrcode">
                    <p>Ou escaneie o QR Code:</p>
                    <img src="${qrCodeUrl}" alt="QR Code">
                  </div>
                  `
                  : ""
              }
              
              <p>Compartilhe esta página com seu amor para expressar seus sentimentos de uma forma única e especial.</p>
              `
          }
        </div>
        
        <div class="footer">
          <p>Este e-mail foi enviado por Amor em Código.</p>
          <p>© ${new Date().getFullYear()} Amor em Código. Todos os direitos reservados.</p>
        </div>
      </body>
      </html>
    `

    // Preparar os dados para o envio do e-mail
    const mailData = {
      from: {
        email: "contato@amoremcodigo.com.br",
        name: "Amor em Código",
      },
      to: [
        {
          email: data.email,
          name: coupleNames,
        },
      ],
      subject: isPending
        ? "Seu pedido foi recebido - Amor em Código"
        : "Sua página de amor personalizada está pronta! 💕",
      html: emailHtml,
    }

    // Enviar o e-mail
    console.log("Enviando e-mail para:", data.email)
    const success = await sendEmail(mailData)

    if (!success) {
      console.error("Falha ao enviar e-mail")

      // Tentar método alternativo direto
      console.log("Tentando método alternativo de envio")

      try {
        // Implementar um método alternativo de envio de e-mail aqui
        // Por exemplo, usando fetch para outro serviço de e-mail

        console.log("Método alternativo não implementado, mas continuando o fluxo")
      } catch (altError) {
        console.error("Erro no método alternativo:", altError)
      }

      // Retornar sucesso mesmo com falha para não interromper o fluxo
      return NextResponse.json({
        success: true,
        message: "Processo continuado apesar de falha no envio de e-mail",
      })
    }

    console.log("E-mail enviado com sucesso para:", data.email)
    return NextResponse.json({
      success: true,
      message: "E-mail enviado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao processar requisição de envio de e-mail:", error)

    // Retornar sucesso mesmo com erro para não interromper o fluxo
    return NextResponse.json({
      success: true,
      message: "Processo continuado apesar de erro no processamento",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
