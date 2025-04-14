import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Extrair dados do corpo da requisição
    const { email, pageUrl, coupleNames, qrCodeUrl, isPending = false } = await request.json()

    console.log("=== ENVIANDO EMAIL ===")
    console.log("Email:", email)
    console.log("URL da página:", pageUrl)
    console.log("Nomes:", coupleNames)
    console.log("Status de pagamento:", isPending ? "Pendente" : "Confirmado")

    // Validar dados
    if (!email || !pageUrl || !coupleNames) {
      console.error("Dados incompletos:", { email, pageUrl, coupleNames })
      return NextResponse.json({ error: "Email, pageUrl e coupleNames são obrigatórios" }, { status: 400 })
    }

    // Definir o assunto com base no status do pagamento
    const subject = isPending
      ? `Sua página para ${coupleNames} foi criada! Aguardando confirmação de pagamento.`
      : `Sua página personalizada para ${coupleNames} está pronta!`

    // Adicionar mensagem sobre o status do pagamento
    const paymentMessage = isPending
      ? `<div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold;">⚠️ Aguardando confirmação de pagamento</p>
          <p style="margin-top: 10px;">Sua página foi criada com sucesso, mas estamos aguardando a confirmação do seu pagamento. Você receberá outro email quando o pagamento for confirmado.</p>
        </div>`
      : `<div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold;">✅ Pagamento confirmado</p>
          <p style="margin-top: 10px;">Seu pagamento foi confirmado e sua página está pronta para ser compartilhada!</p>
        </div>`

    // Verificar a chave API do MailerSend
    const apiKey = process.env.mailersend_API_KEY
    if (!apiKey) {
      console.error("API Key do MailerSend não configurada")

      // SOLUÇÃO DE EMERGÊNCIA: Retornar sucesso mesmo sem enviar o email
      // Isso permite que o fluxo continue funcionando mesmo sem o email
      return NextResponse.json({
        success: true,
        warning: "Email não enviado: API Key não configurada",
        emailData: { email, pageUrl, coupleNames },
      })
    }

    console.log("API Key do MailerSend:", apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 5))

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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #9333EA; margin-bottom: 5px;">Amor em Código</h1>
            <p style="color: #666; font-size: 16px;">Sua página personalizada está pronta!</p>
          </div>
          
          ${paymentMessage}
          
          <div style="background-color: #f8f8f8; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
            <p>Olá,</p>
            <p>Sua página personalizada para <strong>${coupleNames}</strong> foi criada com sucesso!</p>
            <p>Você pode acessar e compartilhar sua página através do link abaixo:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${pageUrl}" style="display: inline-block; background-color: #9333EA; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acessar Minha Página</a>
            </div>
            
            <p>Ou copie e cole este link no navegador:</p>
            <p style="background-color: #eee; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">${pageUrl}</p>
          </div>
          
          ${
            qrCodeUrl
              ? `
          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 15px; font-weight: bold;">QR Code da sua página:</p>
            <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
            <p style="font-size: 14px; color: #666; margin-top: 10px;">Escaneie este QR Code para acessar sua página</p>
          </div>
          `
              : ""
          }
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px; font-size: 14px; color: #666;">
            <p>Compartilhe este link ou QR Code com seu amor para uma surpresa especial!</p>
            <p>Se tiver alguma dúvida, entre em contato conosco pelo WhatsApp.</p>
            <p style="margin-top: 20px;">Atenciosamente,<br>Equipe Amor em Código</p>
          </div>
        </div>
      `,
    }

    console.log("Enviando email via MailerSend...")

    try {
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
        console.log("Resposta da API do MailerSend (JSON):", JSON.stringify(responseData, null, 2))
      } catch (e) {
        console.log("Resposta não é JSON válido")
      }

      // Verificar se houve erro na API do MailerSend
      if (!response.ok) {
        console.error("Erro na API do MailerSend:", responseData || responseText)

        // SOLUÇÃO DE EMERGÊNCIA: Retornar sucesso mesmo com erro no email
        // Isso permite que o fluxo continue funcionando mesmo com erro no email
        return NextResponse.json({
          success: true,
          warning: "Email não enviado devido a erro na API",
          emailData: { email, pageUrl, coupleNames },
          apiError: responseData || responseText,
        })
      }

      console.log("Email enviado com sucesso!")
      return NextResponse.json({ success: true, data: responseData })
    } catch (fetchError) {
      console.error("Erro ao fazer requisição para a API do MailerSend:", fetchError)

      // SOLUÇÃO DE EMERGÊNCIA: Retornar sucesso mesmo com erro no email
      return NextResponse.json({
        success: true,
        warning: "Email não enviado devido a erro na requisição",
        emailData: { email, pageUrl, coupleNames },
        fetchError: fetchError instanceof Error ? fetchError.message : String(fetchError),
      })
    }
  } catch (error) {
    console.error("Erro ao enviar email:", error)

    // SOLUÇÃO DE EMERGÊNCIA: Retornar sucesso mesmo com erro
    return NextResponse.json({
      success: true,
      warning: "Erro ao processar solicitação de email",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
