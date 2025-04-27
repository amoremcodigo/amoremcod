"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

export default function FacebookPixel() {
  const initialized = useRef(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Inicializar o Facebook Pixel apenas uma vez
    if (!initialized.current) {
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
      window.fbq("init", "645764484878124")
      initialized.current = true

      // Registrar o evento PageView inicial
      window.fbq("track", "PageView")
    }
  }, [])

  // Rastrear mudanças de página
  useEffect(() => {
    // Verificar se o fbq está disponível
    if (typeof window.fbq !== "function") return

    // Registrar o evento PageView a cada mudança de rota
    window.fbq("track", "PageView")

    console.log("Facebook Pixel: PageView tracked for", pathname)
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
