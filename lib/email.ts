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
        isPending: false, // Pagamento confirmado
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
