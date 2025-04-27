// Função auxiliar para enviar eventos para o dataLayer
export function sendGTMEvent(event: string, data: Record<string, any> = {}) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event,
      ...data,
    })
    console.log(`[GTM] Evento enviado: ${event}`, data)
  }
}

// Eventos comuns para seu site
export const GTMEvents = {
  // Eventos de visualização
  VIEW_PAGE: "view_page",
  VIEW_ITEM: "view_item",

  // Eventos de formulário
  START_FORM: "start_form",
  FORM_STEP: "form_step",
  FORM_SUBMIT: "form_submit",
  FORM_ERROR: "form_error",

  // Eventos de conversão
  ADD_TO_CART: "add_to_cart",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",

  // Eventos de engajamento
  CLICK_BUTTON: "click_button",
  SHARE: "share",
  DOWNLOAD: "download",
}
