"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface GoogleTagManagerProps {
  gtmId: string
}

export default function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!gtmId) return

    // Inicializar o dataLayer
    window.dataLayer = window.dataLayer || []

    // Função para enviar eventos para o dataLayer
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }

    // Carregar o script do GTM
    const script = document.createElement("script")
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `
    document.head.appendChild(script)

    // Adicionar o noscript para usuários sem JavaScript
    const noscript = document.createElement("noscript")
    const iframe = document.createElement("iframe")
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`
    iframe.height = "0"
    iframe.width = "0"
    iframe.style.display = "none"
    iframe.style.visibility = "hidden"
    noscript.appendChild(iframe)
    document.body.prepend(noscript)

    // Limpar na desmontagem
    return () => {
      document.head.removeChild(script)
      if (document.body.contains(noscript)) {
        document.body.removeChild(noscript)
      }
    }
  }, [gtmId])

  // Rastrear mudanças de página
  useEffect(() => {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: "pageview",
        page: pathname,
        query: Object.fromEntries(searchParams.entries()),
      })
    }
  }, [pathname, searchParams])

  return null
}

// Adicionar a declaração de tipo para o dataLayer
declare global {
  interface Window {
    dataLayer: any[]
  }
}
