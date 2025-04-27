"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

declare global {
  interface Window {
    fbq: any
  }
}

export default function FacebookPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Inicializar o Facebook Pixel
  useEffect(() => {
    // Código padrão do Pixel do Facebook
    !((f, b, e, v, n, t, s) => {
      if (f.fbq) return
      n = f.fbq = () => {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = !0
      n.version = "2.0"
      n.queue = []
      t = b.createElement(e)
      t.async = !0
      t.src = v
      s = b.getElementsByTagName(e)[0]
      if (s && s.parentNode) s.parentNode.insertBefore(t, s)
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")

    // Inicializar com o ID do Pixel fornecido
    window.fbq("init", "645764484878124")

    // Registrar o evento PageView
    window.fbq("track", "PageView", {
      page_path: pathname,
      page_title: document.title,
      page_location: window.location.href,
    })

    // Função para rastrear eventos
    const trackEvent = (event, options = {}) => {
      if (window.fbq) {
        window.fbq("track", event, options)
      }
    }

    // Rastrear visualização de conteúdo específico
    if (pathname?.includes("/pagina/")) {
      trackEvent("ViewContent", {
        content_type: "page",
        content_ids: [pathname.split("/").pop()],
        content_name: document.title,
      })
    }

    // Rastrear conclusão de compra na página de obrigado
    if (pathname === "/obrigado") {
      const orderId = searchParams?.get("order")
      const value = searchParams?.get("value")
      const plan = searchParams?.get("plan")

      trackEvent("Purchase", {
        content_type: "product",
        content_name: plan || "Plano",
        content_ids: orderId ? [orderId] : undefined,
        value: value ? Number.parseFloat(value) : undefined,
        currency: "BRL",
      })

      trackEvent("CompleteRegistration", {
        content_name: plan || "Plano",
        status: "complete",
      })
    }

    // Configurar rastreamento de cliques com um pequeno atraso
    const setupClickTracking = () => {
      try {
        // Rastrear cliques em botões importantes
        const handleButtonClick = (e) => {
          const element = e.currentTarget
          const text = (element.textContent || "").toLowerCase()

          if (
            text.includes("comprar") ||
            text.includes("continuar") ||
            text.includes("criar") ||
            text.includes("começar")
          ) {
            trackEvent("InitiateCheckout", {
              button_text: element.textContent,
              page_path: pathname,
            })
          } else if (text.includes("plano") || text.includes("escolher")) {
            trackEvent("AddToCart", {
              content_type: "product",
              content_name: text,
              page_path: pathname,
            })
          } else if (text.includes("whatsapp") || text.includes("contato")) {
            trackEvent("Contact", {
              contact_method: "whatsapp",
              page_path: pathname,
            })
          }
        }

        // Adicionar listeners aos botões e links
        document.querySelectorAll("button, a").forEach((element) => {
          if (!element.hasAttribute("data-fb-tracked")) {
            element.setAttribute("data-fb-tracked", "true")
            element.addEventListener("click", handleButtonClick)
          }
        })

        // Rastrear envio de formulários
        const handleFormSubmit = (e) => {
          if (pathname === "/" || pathname?.includes("/criar")) {
            trackEvent("Lead", {
              form_id: e.currentTarget.id || pathname,
              page_path: pathname,
            })
          }
        }

        document.querySelectorAll("form").forEach((form) => {
          if (!form.hasAttribute("data-fb-tracked")) {
            form.setAttribute("data-fb-tracked", "true")
            form.addEventListener("submit", handleFormSubmit)
          }
        })
      } catch (error) {
        // Silenciar erros para não interromper a execução
      }
    }

    // Executar após um pequeno atraso para garantir que o DOM esteja pronto
    const timer = setTimeout(setupClickTracking, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [pathname, searchParams])

  return (
    <>
      {/* Noscript fallback para navegadores sem JavaScript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=645764484878124&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  )
}
