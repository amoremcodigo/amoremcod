/**
 * Módulo para lidar com envio de emails
 */

/**
 * Envia um email de confirmação para o cliente com o link da página e QR Code
 * @param pageData Dados da página do cliente
 * @returns true se o email foi enviado com sucesso, false caso contrário
 */
export async function sendConfirmationEmail(pageData: any) {
  try {
    console.log("=== ENVIANDO E-MAIL DE CONFIRMAÇÃO PARA:", pageData.email)
    console.log("Status de pagamento:", pageData.payment_status)

    // Determinar se o pagamento está pendente
    const isPending =
      !pageData.payment_status ||
      pageData.payment_status === "pending" ||
      pageData.payment_status === "awaiting_payment"

    console.log("Pagamento pendente?", isPending ? "SIM" : "NÃO")

    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: pageData.email,
        pageUrl: pageData.page_url,
        coupleNames: pageData.couple_names,
        qrCodeUrl: pageData.qr_code_url,
        isPending: isPending,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error("ERRO AO ENVIAR E-MAIL:", emailResponse.status, errorText)
      return false
    }

    console.log("E-MAIL ENVIADO COM SUCESSO PARA:", pageData.email)
    return true
  } catch (error) {
    console.error("ERRO AO ENVIAR E-MAIL:", error)
    return false
  }
}

/**
 * Envia um email usando a API do MailerSend
 * @param mailData Dados do email a ser enviado
 * @returns true se o email foi enviado com sucesso, false caso contrário
 */
export async function sendEmail(mailData: any) {
  try {
    console.log("=== INICIANDO ENVIO DE EMAIL DETALHADO ===")
    console.log("Email para:", mailData.to[0].email)
    console.log("Assunto:", mailData.subject)
    console.log("Tamanho do HTML:", mailData.html?.length || 0, "caracteres")

    // Verificar a chave API do MailerSend
    const apiKey = process.env.mailersend_API_KEY
    if (!apiKey) {
      console.error("ERRO CRÍTICO: API Key do MailerSend não configurada")
      return false
    }

    console.log(
      "API Key do MailerSend encontrada:",
      apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5),
    )

    try {
      // Enviar o email usando a API do MailerSend
      console.log("Enviando requisição para a API do MailerSend...")
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
      console.log("Status da resposta:", response.status)
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
        return false
      }

      console.log("Email enviado com sucesso!")
      return true
    } catch (fetchError) {
      console.error("Erro ao fazer requisição para a API do MailerSend:", fetchError)
      return false
    }
  } catch (error) {
    console.error("Erro geral ao enviar email:", error)
    return false
  }
}
