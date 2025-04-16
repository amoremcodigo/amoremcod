// Facebook Pixel ID
export const FB_PIXEL_ID = "645764484878124"

// Track custom event
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window.fbq !== "undefined") {
    window.fbq("track", eventName, params)
  }
}

// Track standard events
export const trackPurchase = (value: number, currency = "BRL") => {
  trackEvent("Purchase", { value, currency })
}

export const trackAddToCart = (value: number, currency = "BRL") => {
  trackEvent("AddToCart", { value, currency })
}

export const trackInitiateCheckout = (value: number, currency = "BRL") => {
  trackEvent("InitiateCheckout", { value, currency })
}

export const trackCompleteRegistration = () => {
  trackEvent("CompleteRegistration")
}

export const trackLead = () => {
  trackEvent("Lead")
}

export const trackContact = () => {
  trackEvent("Contact")
}
