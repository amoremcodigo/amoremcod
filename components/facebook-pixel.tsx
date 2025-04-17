"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    fbq: any
  }
}

export default function FacebookPixel() {
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
    window.fbq("init", "645764484878124")

    // Registrar o evento PageView
    window.fbq("track", "PageView")

    // Limpar
    return () => {
      // Não há nada específico para limpar
    }
  }, [])

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
