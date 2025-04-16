"use client"

import { useEffect } from "react"
import Script from "next/script"
import { usePathname } from "next/navigation"

// Facebook Pixel ID
const FB_PIXEL_ID = "645764484878124"

// Initialize Facebook Pixel
export const initFacebookPixel = () => {
  window.fbq =
    window.fbq ||
    (() => {
      // @ts-ignore
      window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments)
    })

  // @ts-ignore
  window.fbq.push = window.fbq
  // @ts-ignore
  window.fbq.loaded = true
  // @ts-ignore
  window.fbq.version = "2.0"
  // @ts-ignore
  window.fbq.queue = []

  window.fbq("init", FB_PIXEL_ID)
  window.fbq("track", "PageView")
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== "undefined" && typeof window.fbq !== "undefined") {
    window.fbq("track", "PageView", {
      page_path: url,
    })
  }
}

// Facebook Pixel component
export default function FacebookPixel() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize Facebook Pixel
    initFacebookPixel()

    // Track page view on first load
    trackPageView(pathname)

    // Setup router event listener for client-side navigation
    const handleRouteChange = () => {
      trackPageView(window.location.pathname + window.location.search)
    }

    // Add event listener for route changes
    window.addEventListener("popstate", handleRouteChange)

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [pathname])

  return (
    <>
      {/* Facebook Pixel Base Code */}
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

      {/* Fallback for when JavaScript is disabled */}
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

// Type definitions for window.fbq
declare global {
  interface Window {
    fbq: any
  }
}
