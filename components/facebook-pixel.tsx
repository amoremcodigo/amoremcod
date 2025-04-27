"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import { useEffect } from "react"

// Definir o ID do pixel como constante para fácil manutenção
const FB_PIXEL_ID = "645764484878124"

declare global {
  interface Window {
    fbq: any
  }
}

export default function FacebookPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Verificar se o fbq já está definido
    if (!window.fbq) {
      window.fbq = () => {
        // @ts-ignore
        window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments)
      }
      window._fbq = window.fbq
      window.fbq.push = window.fbq
      window.fbq.loaded = true
      window.fbq.version = "2.0"
      window.fbq.queue = []
    }

    // Inicializar o pixel
    window.fbq("init", FB_PIXEL_ID)

    // Registrar o evento PageView
    window.fbq("track", "PageView")

    // Registrar eventos adicionais com base na página atual
    if (pathname === "/") {
      window.fbq("track", "ViewContent", { content_name: "Homepage" })
    } else if (pathname === "/criar") {
      window.fbq("track", "ViewContent", { content_name: "Página de Criação" })
    } else if (pathname.startsWith("/pagina/")) {
      window.fbq("track", "ViewContent", {
        content_name: "Visualização de Página Personalizada",
        content_ids: [pathname.split("/").pop()],
      })
    } else if (pathname === "/obrigado") {
      window.fbq("track", "CompleteRegistration", {
        content_name: "Registro Completo",
        status: "success",
      })
    }

    // Rastrear parâmetros UTM se presentes
    if (searchParams) {
      const utmSource = searchParams.get("utm_source")
      const utmMedium = searchParams.get("utm_medium")
      const utmCampaign = searchParams.get("utm_campaign")

      if (utmSource || utmMedium || utmCampaign) {
        window.fbq("trackCustom", "UTMParameters", {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        })
      }
    }

    // Limpar
    return () => {
      // Não há nada específico para limpar
    }
  }, [pathname, searchParams])

  // Função para rastrear eventos de clique em botões importantes
  const trackButtonClick = (buttonName: string) => {
    if (window.fbq) {
      window.fbq("trackCustom", "ButtonClick", { button_name: buttonName })
    }
  }

  // Expor a função de rastreamento globalmente
  useEffect(() => {
    // @ts-ignore
    window.trackFBEvent = (eventName: string, params = {}) => {
      if (window.fbq) {
        window.fbq("trackCustom", eventName, params)
      }
    }

    // Adicionar listeners para botões importantes
    const addToCartButtons = document.querySelectorAll('[data-fb-event="AddToCart"]')
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", () => trackButtonClick("AddToCart"))
    })

    const ctaButtons = document.querySelectorAll('[data-fb-event="CTA"]')
    ctaButtons.forEach((button) => {
      button.addEventListener("click", () => trackButtonClick("CTA"))
    })

    return () => {
      // Remover listeners ao desmontar
      addToCartButtons.forEach((button) => {
        button.removeEventListener("click", () => trackButtonClick("AddToCart"))
      })

      ctaButtons.forEach((button) => {
        button.removeEventListener("click", () => trackButtonClick("CTA"))
      })
    }
  }, [])

  return (
    <>
      {/* Usar o componente Script do Next.js para carregar o script do Facebook */}
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />

      {/* Noscript fallback para navegadores sem JavaScript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
