"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

export default function FacebookPixel() {
  const initialized = useRef(false)
  const pathname = usePathname()

  // IDs dos pixels
  const primaryPixelId = "1251716579642859"
  const secondaryPixelId = "1803666846848435"

  // Função para carregar o script do Facebook Pixel
  const loadFacebookPixel = () => {
    return new Promise<void>((resolve) => {
      if (window.fbq) {
        resolve()
        return
      }

      // Adicionar o código base do Facebook Pixel
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

      // Resolver a promessa quando o script estiver carregado
      const checkFbqLoaded = setInterval(() => {
        if (window.fbq && window.fbq.loaded) {
          clearInterval(checkFbqLoaded)
          resolve()
        }
      }, 100)
    })
  }

  // Inicializar os pixels do Facebook
  useEffect(() => {
    if (initialized.current) return

    const initPixels = async () => {
      await loadFacebookPixel()

      // Inicializar o pixel primário
      window.fbq("init", primaryPixelId)

      // Adicionar o pixel secundário
      window.fbq("init", secondaryPixelId)

      // Rastrear o evento PageView inicial
      window.fbq("track", "PageView")

      initialized.current = true

      // Log para debug
      console.log("Facebook Pixels initialized:", primaryPixelId, secondaryPixelId)
    }

    initPixels()
  }, [])

  // Rastrear mudanças de página
  useEffect(() => {
    if (!initialized.current) return

    // Rastrear o evento PageView quando a página mudar
    const timer = setTimeout(() => {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView")
        console.log("PageView tracked for both pixels")
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <>
      {/* Noscript fallback para navegadores sem JavaScript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${primaryPixelId}&ev=PageView&noscript=1`}
          alt=""
        />
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${secondaryPixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
