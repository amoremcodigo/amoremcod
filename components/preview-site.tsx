"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

export function PreviewSite() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)

    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return (
    <section className="w-full py-16 md:py-20" id="preview">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Veja como vai ficar a sua <span className="gradient-text">página</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Esta é uma prévia de como sua página personalizada será exibida.
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="relative">
            <Image
              src={isMobile ? "/images/qr-code-phone-new.png" : "/images/qr-code-phone.png"}
              alt="Prévia da página no celular"
              width={isMobile ? 300 : 400}
              height={isMobile ? 600 : 800}
              className="rounded-2xl shadow-2xl floating-qrcode"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
