"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

declare global {
  interface Window {
    fbq: any
    fbEventsQueue: any[]
  }
}

// Função auxiliar para rastrear eventos do Facebook Pixel
const trackFbEvent = (event: string, options?: any) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, options)
    console.log(`[FB Pixel] Tracked event: ${event}`, options || {})
  } else if (typeof window !== "undefined") {
    // Fila de eventos para garantir que nenhum evento seja perdido antes do pixel carregar
    if (!window.fbEventsQueue) window.fbEventsQueue = []
    window.fbEventsQueue.push({ event, options })
    console.log(`[FB Pixel] Queued event: ${event}`, options || {})
  }
}

export default function FacebookPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timeOnPageRef = useRef<number>(Date.now())
  const previousPathRef = useRef<string>("")

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
      s.parentNode.insertBefore(t, s)
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")

    // Inicializar com o ID do Pixel fornecido
    window.fbq("init", "645764484878124", {
      // Parâmetros avançados para melhorar a qualidade dos dados
      em: undefined, // Email (hash)
      ph: undefined, // Telefone (hash)
      fn: undefined, // Primeiro nome (hash)
      ln: undefined, // Sobrenome (hash)
      external_id: undefined, // ID externo do usuário
    })

    // Processar eventos na fila
    if (window.fbEventsQueue && window.fbEventsQueue.length > 0) {
      window.fbEventsQueue.forEach((item) => {
        window.fbq("track", item.event, item.options)
        console.log(`[FB Pixel] Processed queued event: ${item.event}`, item.options || {})
      })
      window.fbEventsQueue = []
    }

    // Registrar o evento PageView inicial
    trackFbEvent("PageView", {
      page_path: pathname,
      page_title: document.title,
      page_location: window.location.href,
    })

    // Salvar o caminho atual como referência
    previousPathRef.current = pathname

    // Limpar
    return () => {
      // Não há nada específico para limpar
    }
  }, [])

  // Rastrear mudanças de página
  useEffect(() => {
    // Calcular tempo na página anterior
    const timeSpent = Math.floor((Date.now() - timeOnPageRef.current) / 1000)

    // Se não for a primeira carga (mudança de página)
    if (previousPathRef.current && previousPathRef.current !== pathname) {
      // Rastrear tempo gasto na página anterior
      trackFbEvent("CustomEvent", {
        event_name: "time_on_page",
        page_path: previousPathRef.current,
        time_spent_seconds: timeSpent,
      })

      // Rastrear nova visualização de página
      trackFbEvent("PageView", {
        page_path: pathname,
        page_title: document.title,
        page_location: window.location.href,
      })

      // Verificar se é uma página de produto/conteúdo específico
      if (pathname.includes("/pagina/")) {
        trackFbEvent("ViewContent", {
          content_type: "product",
          content_ids: [pathname.split("/").pop()],
          content_name: document.title,
        })
      }
    }

    // Resetar o timer e atualizar o caminho anterior
    timeOnPageRef.current = Date.now()
    previousPathRef.current = pathname

    // Configurar rastreamento de cliques em botões importantes
    const setupButtonTracking = () => {
      // Botões de compra/checkout
      document.querySelectorAll("button, a").forEach((element) => {
        const text = element.textContent?.toLowerCase() || ""
        const classes = element.className || ""

        if (!element.hasAttribute("data-fb-tracked")) {
          element.setAttribute("data-fb-tracked", "true")

          element.addEventListener("click", (e) => {
            // Rastrear cliques em botões importantes
            if (text.includes("comprar") || text.includes("continuar") || classes.includes("gradient-bg")) {
              trackFbEvent("InitiateCheckout", {
                button_text: element.textContent,
                page_path: pathname,
              })
            } else if (text.includes("plano") || text.includes("escolher plano")) {
              trackFbEvent("AddToCart", {
                content_type: "product",
                content_name: text,
                page_path: pathname,
              })
            } else if (text.includes("whatsapp") || text.includes("contato")) {
              trackFbEvent("Contact", {
                contact_method: "whatsapp",
                page_path: pathname,
              })
            }
          })
        }
      })

      // Formulários
      document.querySelectorAll("form").forEach((form) => {
        if (!form.hasAttribute("data-fb-tracked")) {
          form.setAttribute("data-fb-tracked", "true")

          form.addEventListener("submit", (e) => {
            // Identificar o tipo de formulário
            const formId = form.id || ""
            const formAction = form.getAttribute("action") || ""

            if (pathname === "/" || pathname.includes("/criar")) {
              trackFbEvent("Lead", {
                form_id: formId || pathname,
                page_path: pathname,
              })
            } else if (formAction.includes("checkout") || pathname.includes("planos")) {
              trackFbEvent("AddPaymentInfo", {
                page_path: pathname,
              })
            }
          })
        }
      })
    }

    // Executar após um pequeno atraso para garantir que o DOM esteja pronto
    setTimeout(setupButtonTracking, 1000)

    // Configurar rastreamento de saída da página
    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - timeOnPageRef.current) / 1000)

      // Rastrear tempo gasto na página atual antes de sair
      trackFbEvent("CustomEvent", {
        event_name: "time_on_page",
        page_path: pathname,
        time_spent_seconds: timeSpent,
      })
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [pathname, searchParams])

  // Rastrear conclusão de compra quando estiver na página de obrigado
  useEffect(() => {
    if (pathname === "/obrigado") {
      // Extrair parâmetros da URL para informações de compra
      const orderId = searchParams.get("order") || undefined
      const value = searchParams.get("value") || undefined
      const plan = searchParams.get("plan") || undefined

      if (orderId) {
        trackFbEvent("Purchase", {
          content_type: "product",
          content_name: plan || "Plano",
          content_ids: [orderId],
          value: value ? Number.parseFloat(value) : undefined,
          currency: "BRL",
        })

        trackFbEvent("CompleteRegistration", {
          content_name: plan || "Plano",
          status: "complete",
        })
      }
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
