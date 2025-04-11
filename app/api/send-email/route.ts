import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Extrair dados do corpo da requisição
    const { email, pageUrl, coupleNames, qrCodeUrl, isPending = false } = await request.json()

    // Validar dados
    if (!email || !coupleNames) {
      return NextResponse.json({ error: "Email e coupleNames são obrigatórios" }, { status: 400 })
    }

    // Definir o assunto com base no status do pagamento
    const subject = isPending
      ? `Sua página para ${coupleNames} está sendo criada!`
      : `Sua página personalizada para ${coupleNames} está pronta!`

    // Conteúdo do e-mail baseado no status do pagamento
    let emailContent = ""

    if (isPending) {
      // E-mail inicial - apenas informando sobre o processo
      emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #9333EA; margin-bottom: 5px;">Amor em Código</h1>
          <p style="color: #666; font-size: 16px;">Sua página personalizada está sendo criada!</p>
        </div>
        
        <div style="background-color: #f8f8f8; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <p>Olá,</p>
          <p>Recebemos sua solicitação para criar uma página personalizada para <strong>${coupleNames}</strong>!</p>
          <p>Neste momento, estamos processando seu pagamento e criando sua página personalizada.</p>
          <p><strong>Em breve</strong>, assim que confirmarmos seu pagamento, você receberá um novo e-mail contendo:</p>
          <ul style="margin-top: 10px; margin-bottom: 10px;">
            <li>O link para acessar sua página personalizada</li>
            <li>O QR Code para compartilhar com seu amor</li>
            <li>Instruções para compartilhar e imprimir o QR Code</li>
          </ul>
          <p>Este processo geralmente leva alguns minutos, mas pode demorar até 24 horas em alguns casos.</p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; font-size: 14px; color: #666;">
          <p>Se tiver alguma dúvida, entre em contato conosco pelo WhatsApp.</p>
          <p style="margin-top: 20px;">Atenciosamente,<br>Equipe Amor em Código</p>
        </div>
      </div>
    `
    } else {
      // E-mail de confirmação - sem link e QR Code
      emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #9333EA; margin-bottom: 5px;">Amor em Código</h1>
          <p style="color: #666; font-size: 16px;">Sua página personalizada está pronta!</p>
        </div>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold;">✅ Pagamento confirmado</p>
          <p style="margin-top: 10px;">Seu pagamento foi confirmado e sua página está pronta!</p>
        </div>
        
        <div style="background-color: #f8f8f8; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <p>Olá,</p>
          <p>Sua página personalizada para <strong>${coupleNames}</strong> foi criada com sucesso!</p>
          <p>Por motivos de segurança, o link de acesso e o QR Code da sua página serão enviados em um e-mail separado em breve.</p>
          <p>Fique atento à sua caixa de entrada e também à pasta de spam.</p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; font-size: 14px; color: #666;">
          <p>Se tiver alguma dúvida, entre em contato conosco pelo WhatsApp.</p>
          <p style="margin-top: 20px;">Atenciosamente,<br>Equipe Amor em Código</p>
        </div>
      </div>
      `
    }

    // Configurar o corpo da requisição para a API do MailerSend
    const mailData = {
      to: [
        {
          email: email,
          name: coupleNames,
        },
      ],
      from: {
        email: "noreply@amoremcodigo.com.br",
        name: "Amor em Código",
      },
      subject: subject,
      html: emailContent,
    }

    // Enviar o email usando a API do MailerSend
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.mailersend_API_KEY}`,
      },
      body: JSON.stringify(mailData),
    })

    const responseData = await response.json()

    // Verificar se houve erro na API do MailerSend
    if (!response.ok) {
      console.error("Erro na API do MailerSend:", responseData)
      return NextResponse.json({ error: "Erro ao enviar email", details: responseData }, { status: response.status })
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 })
  }
}
