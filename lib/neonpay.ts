// Funções de utilidade para a Neon Pay

export const NEON_PAY_CHECKOUT_URLS = {
  premium: "https://checkout.neonpay.com.br/checkout/cma699jmn02tgt4xjw8nyh7vh?offer=FO0XZT0",
  basic: "https://checkout.neonpay.com.br/checkout/cma699jmn02tgt4xjw8nyh7vh?offer=ZSC4E0P",
}

export async function createPayment(
  pageId: string,
  plan: string,
  userData: {
    name: string
    email: string
    phone?: string
  },
) {
  const checkoutUrl = plan === "premium" ? NEON_PAY_CHECKOUT_URLS.premium : NEON_PAY_CHECKOUT_URLS.basic

  // Adicionar parâmetros ao URL de checkout
  const finalCheckoutUrl = `${checkoutUrl}&external_reference=${pageId}&buyer_name=${encodeURIComponent(userData.name)}&buyer_email=${encodeURIComponent(userData.email)}&buyer_phone=${encodeURIComponent(userData.phone || "")}&redirect_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/obrigado?page_id=${pageId}`)}`

  return {
    checkout_url: finalCheckoutUrl,
  }
}

export async function checkPaymentStatus(pageId: string) {
  // Implementação da verificação de status de pagamento
  // Esta é uma função simulada, você precisará implementar a lógica real
  // para consultar a API da Neon Pay

  try {
    const apiKey = process.env.NEON_PAY_API_KEY

    // Aqui você faria uma chamada para a API da Neon Pay
    // para verificar o status do pagamento usando o pageId como referência externa

    // Exemplo simulado:
    return {
      status: "approved", // ou "pending", "rejected", etc.
      message: "Pagamento aprovado",
    }
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error)
    throw error
  }
}

// Mapeamento de status da Neon Pay para o formato do seu sistema
export function mapPaymentStatus(neonPayStatus: string) {
  const statusMap: Record<string, string> = {
    approved: "active",
    pending: "pending",
    rejected: "failed",
    refunded: "refunded",
    cancelled: "cancelled",
  }

  return statusMap[neonPayStatus] || "pending"
}
