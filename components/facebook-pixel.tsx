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

  // Array com os IDs dos pixels
  const pixelIds = ["1251716579642859", "1803666846848435"]

  // Função para carregar o script do Facebook Pixel
  const loadFacebookPixel = () => {
    return new Promise<void>((resolve) => {
      if (window.fbq) {
        resolve()
        return
      }

      // Criar o script do Facebook Pixel
      const script = document.createElement("script")
      script.src = "https://connect.facebook.net/en_US/fbevents.js"
      script.async = true
      script.onload = () => resolve()

      // Configurar o objeto fbq
      window.fbq = () => {
        window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments)
      }

      if (!window._fbq) window._fbq = window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []

      // Adicionar o script ao documento
      document.head.appendChild(script)
    })
  }

  // Inicializar o Facebook Pixel
  useEffect(() => {
    if (initialized.current) return

    const initPixel = async () => {
      await loadFacebookPixel()

      // Inicializar cada pixel
      pixelIds.forEach((id) => {
        window.fbq("init", id)
      })

      // Registrar o evento PageView inicial para todos os pixels
      window.fbq("track", "PageView")

      initialized.current = true
    }

    initPixel()
  }, [])

  // Rastrear mudanças de página
  useEffect(() => {
    if (!initialized.current) return

    // Pequeno atraso para garantir que o evento seja registrado após a mudança de página
    const timer = setTimeout(() => {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView")
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <>
      {/* Noscript fallback para navegadores sem JavaScript - para ambos os pixels */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1251716579642859&ev=PageView&noscript=1"
          alt=""
        />
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=1803666846848435&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  )
}
