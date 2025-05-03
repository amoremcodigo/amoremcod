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
    console.log("ENVIANDO E-MAIL DE CONFIRMAÇÃO PARA:", pageData.email)

    // Verificar se temos o e-mail do cliente
    if (!pageData.email) {
      console.error("E-MAIL DO CLIENTE NÃO FORNECIDO")
      return false
    }

    // Garantir que temos uma URL de página
    if (!pageData.page_url && pageData.page_id) {
      console.log("URL da página não fornecida, gerando com base no ID")
      pageData.page_url = `${process.env.NEXT_PUBLIC_SITE_URL}/pagina/${pageData.page_id}`
    }

    // Garantir que temos uma URL de QR Code
    if (!pageData.qr_code_url && pageData.page_url) {
      console.log("URL do QR Code não fornecida, gerando com base na URL da página")
      pageData.qr_code_url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/qr-code?url=${encodeURIComponent(pageData.page_url)}`
    }

    // Garantir que temos um nome de casal
    if (!pageData.couple_names) {
      console.log("Nome do casal não fornecido, usando valor padrão")
      pageData.couple_names = "Casal Especial"
    }

    // Tentar enviar o e-mail com múltiplas tentativas
    const maxRetries = 3
    let attempt = 0
    let lastError = null

    while (attempt < maxRetries) {
      attempt++
      console.log(`Tentativa ${attempt} de ${maxRetries} para enviar e-mail`)

      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: pageData.email,
            pageUrl: pageData.page_url || `${process.env.NEXT_PUBLIC_SITE_URL}/pagina/${pageData.page_id || "unknown"}`,
            coupleNames: pageData.couple_names || "Casal Especial",
            qrCodeUrl: pageData.qr_code_url || "",
            isPending: false, // Pagamento confirmado
            forceSend: true, // Forçar envio mesmo com erros
          }),
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error(`ERRO AO ENVIAR E-MAIL (tentativa ${attempt}):`, emailResponse.status, errorText)
          lastError = new Error(`Status ${emailResponse.status}: ${errorText}`)

          // Esperar antes de tentar novamente
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
          continue
        }

        console.log("E-MAIL ENVIADO COM SUCESSO PARA:", pageData.email)
        return true
      } catch (error) {
        console.error(`ERRO AO ENVIAR E-MAIL (tentativa ${attempt}):`, error)
        lastError = error

        // Esperar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
        continue
      }
    }

    // Se todas as tentativas falharam, registrar o erro mas não interromper o fluxo
    console.error("TODAS AS TENTATIVAS DE ENVIO DE E-MAIL FALHARAM:", lastError)
    return false
  } catch (error) {
    console.error("ERRO GERAL AO ENVIAR E-MAIL:", error)
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
    console.log("=== ENVIANDO EMAIL ===")
    console.log("Email:", mailData.to[0].email)
    console.log("Assunto:", mailData.subject)

    // Verificar a chave API do MailerSend
    const apiKey = process.env.mailersend_API_KEY
    if (!apiKey) {
      console.error("API Key do MailerSend não configurada")
      return false
    }

    console.log("API Key do MailerSend:", apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5))

    // Verificar se temos os dados mínimos necessários
    if (!mailData.to || !mailData.to[0] || !mailData.to[0].email) {
      console.error("Dados de destinatário inválidos")
      return false
    }

    if (!mailData.subject) {
      console.log("Assunto não fornecido, usando valor padrão")
      mailData.subject = "Sua página de amor personalizada"
    }

    if (!mailData.html) {
      console.log("Conteúdo HTML não fornecido, usando valor padrão")
      mailData.html = "<p>Sua página de amor personalizada está pronta!</p>"
    }

    console.log("Enviando email via MailerSend...")

    // Implementar múltiplas tentativas
    const maxRetries = 3
    let attempt = 0
    let lastError = null

    while (attempt < maxRetries) {
      attempt++
      console.log(`Tentativa ${attempt} de ${maxRetries} para enviar e-mail via MailerSend`)

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
        console.log(`Resposta bruta da API do MailerSend (tentativa ${attempt}):`, responseText.substring(0, 500))

        let responseData
        try {
          responseData = JSON.parse(responseText)
          console.log(
            `Resposta da API do MailerSend (JSON) (tentativa ${attempt}):`,
            JSON.stringify(responseData, null, 2).substring(0, 500),
          )
        } catch (e) {
          console.log("Resposta não é JSON válido")
        }

        // Verificar se houve erro na API do MailerSend
        if (!response.ok) {
          console.error(`Erro na API do MailerSend (tentativa ${attempt}):`, responseData || responseText)
          lastError = new Error(`Status ${response.status}: ${responseText}`)

          // Esperar antes de tentar novamente
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
          continue
        }

        console.log("Email enviado com sucesso!")
        return true
      } catch (fetchError) {
        console.error(`Erro ao fazer requisição para a API do MailerSend (tentativa ${attempt}):`, fetchError)
        lastError = fetchError

        // Esperar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt))
        continue
      }
    }

    // Se todas as tentativas falharam, registrar o erro mas não interromper o fluxo
    console.error("TODAS AS TENTATIVAS DE ENVIO DE E-MAIL VIA MAILERSEND FALHARAM:", lastError)
    return false
  } catch (error) {
    console.error("Erro geral ao enviar email:", error)
    return false
  }
}
