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

    // Conteúdo do e-mail simplificado
    let emailContent = ""

    if (isPending) {
      // E-mail inicial - apenas informando sobre o processo
      emailContent = `
        <div>
          <h1>Amor em Código</h1>
          <p>Sua página personalizada está sendo criada!</p>
          <p>Olá,</p>
          <p>Recebemos sua solicitação para criar uma página personalizada para ${coupleNames}!</p>
          <p>Neste momento, estamos processando seu pagamento e criando sua página personalizada.</p>
          <p>Em breve, assim que confirmarmos seu pagamento, você receberá um novo e-mail com o link e QR Code.</p>
          <p>Atenciosamente,<br>Equipe Amor em Código</p>
        </div>
      `
    } else {
      // E-mail de confirmação - sem link e QR Code
      emailContent = `
        <div>
          <h1>Amor em Código</h1>
          <p>Sua página personalizada está pronta!</p>
          <p>Olá,</p>
          <p>Sua página personalizada para ${coupleNames} foi criada com sucesso!</p>
          <p>Por motivos de segurança, o link de acesso e o QR Code da sua página serão enviados em um e-mail separado em breve.</p>
          <p>Atenciosamente,<br>Equipe Amor em Código</p>
        </div>
      `
    }

    // Configurar o corpo da requisição para a API do MailerSend
    const mailData = {
      to: [{ email: email, name: coupleNames }],
      from: { email: "noreply@amoremcodigo.com.br", name: "Amor em Código" },
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

    // Retornar resposta de sucesso
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 })
  }
}
