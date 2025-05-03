// Vamos verificar e ajustar a rota de envio de email para suportar emails de pagamento pendente e confirmado

import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, pageUrl, coupleNames, qrCodeUrl, isPending } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email não fornecido" }, { status: 400 })
    }

    // Verificar a chave API do MailerSend
    const apiKey = process.env.mailersend_API_KEY
    if (!apiKey) {
      console.error("API Key do MailerSend não configurada")
      return NextResponse.json({ error: "Configuração de email não disponível" }, { status: 500 })
    }

    // Determinar o assunto e conteúdo com base no status do pagamento
    const subject = isPending
      ? "Sua página de declaração de amor está quase pronta!"
      : "Sua página de declaração de amor está pronta!"

    // Template para pagamento pendente
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sua Página de Amor está quase pronta! ❤️</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #fdf6f8;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background: linear-gradient(135deg, #ff7eb3, #ff758c);
      border-radius: 10px 10px 0 0;
      margin-bottom: 20px;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }
    .content {
      padding: 20px;
      background-color: #fff;
      border-radius: 10px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #999;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #ff7eb3, #ff758c);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: bold;
      margin: 20px 0;
      box-shadow: 0 4px 8px rgba(255,123,179,0.3);
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(255,123,179,0.4);
    }
    .emoji-large {
      font-size: 36px;
      margin: 10px 0;
    }
    .highlight {
      background: linear-gradient(120deg, rgba(255,123,179,0.2) 0%, rgba(255,123,179,0.2) 100%);
      padding: 2px 5px;
      border-radius: 4px;
    }
    .divider {
      height: 3px;
      background: linear-gradient(90deg, transparent, #ff7eb3, transparent);
      margin: 20px 0;
      border: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Amor em Código ✨</h1>
    </div>
    <div class="content">
      <p>Olá ${coupleNames}! 💖</p>
      
      <div style="text-align: center;" class="emoji-large">
        🎉 🥰 💝
      </div>
      
      <p>Estamos <span class="highlight">super animados</span> em informar que sua página de amor está sendo preparada com muito carinho! 💕</p>
      
      <p>Assim que recebermos a confirmação do seu pagamento, sua página ficará disponível imediatamente e enviaremos o QR Code personalizado para você compartilhar com quem ama! 💌</p>
      
      <hr class="divider">
      
      <p>Enquanto isso, você já pode conferir como sua página ficará:</p>
      
      <div style="text-align: center;">
        <a href="${pageUrl}" class="button">Ver Minha Página de Amor 💘</a>
      </div>
      
      <p style="text-align: center; font-style: italic; margin-top: 30px;">⏳ Aguardando confirmação do pagamento... ⏳</p>
      
      <hr class="divider">
      
      <p>Se tiver qualquer dúvida, pode responder diretamente a este email! Estamos aqui para ajudar! 🤗</p>
      
      <p>Com carinho,<br>
      <strong>Equipe Amor em Código</strong> 💻❤️</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Amor em Código - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
`

    // Conteúdo do email para pagamento confirmado
    const confirmedHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #e91e63; text-align: center;">Sua página está pronta!</h1>
        <p>Olá,</p>
        <p>Sua página de declaração de amor para <strong>${coupleNames}</strong> está pronta!</p>
        <p>Acesse sua página através do link: <a href="${pageUrl}" style="color: #e91e63;">${pageUrl}</a></p>
        <p>Ou use o QR Code abaixo:</p>
        ${
          qrCodeUrl
            ? `<div style="text-align: center; margin: 20px 0;">
          <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px; height: auto;" />
        </div>`
            : ""
        }
        <p>Compartilhe este link ou QR Code com a pessoa especial para expressar todo o seu amor!</p>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 18px; font-weight: bold;">Obrigado por usar o Amor em Código!</p>
        </div>
        <p style="font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} Amor em Código - Todos os direitos reservados
        </p>
      </div>
    `

    // Escolher o conteúdo com base no status do pagamento
    const htmlContentFinal = isPending ? htmlContent : confirmedHtml

    // Preparar os dados para o MailerSend
    const mailData = {
      from: {
        email: "contato@amoremcodigo.com.br",
        name: "Amor em Código",
      },
      to: [
        {
          email: email,
          name: coupleNames.split(" ")[0] || "Cliente",
        },
      ],
      subject: subject,
      html: htmlContentFinal,
    }

    console.log("Enviando email via MailerSend...")
    console.log("Para:", email)
    console.log("Assunto:", subject)
    console.log("Status:", isPending ? "Pagamento Pendente" : "Pagamento Confirmado")

    // Enviar o email usando a API do MailerSend
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(mailData),
    })

    // Obter a resposta completa para diagnóstico
    const responseText = await response.text()
    console.log("Resposta bruta da API do MailerSend:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.log("Resposta não é JSON válido")
    }

    // Verificar se houve erro na API do MailerSend
    if (!response.ok) {
      console.error("Erro na API do MailerSend:", responseData || responseText)
      return NextResponse.json(
        { error: "Erro ao enviar email", details: responseData || responseText },
        { status: response.status },
      )
    }

    console.log("Email enviado com sucesso!")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao processar requisição de email:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
