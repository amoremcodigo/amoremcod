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

    // Conteúdo do email para pagamento pendente
    const pendingHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #e91e63; text-align: center;">Quase lá!</h1>
        <p>Olá,</p>
        <p>Sua página de declaração de amor para <strong>${coupleNames}</strong> foi criada e está aguardando a confirmação do pagamento.</p>
        <p>Assim que o pagamento for confirmado, você receberá outro email com o link de acesso e o QR Code da sua página.</p>
        <p>Se você já realizou o pagamento, aguarde alguns instantes para a confirmação.</p>
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 18px; font-weight: bold;">Obrigado por usar o Amor em Código!</p>
        </div>
        <p style="font-size: 12px; color: #666; text-align: center;">
          © ${new Date().getFullYear()} Amor em Código - Todos os direitos reservados
        </p>
      </div>
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
    const htmlContent = isPending ? pendingHtml : confirmedHtml

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
      html: htmlContent,
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
