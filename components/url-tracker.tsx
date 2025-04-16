"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { trackPageView } from "./facebook-pixel"

export default function UrlTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page views on route changes
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
    trackPageView(url)
  }, [pathname, searchParams])

  return null
}
