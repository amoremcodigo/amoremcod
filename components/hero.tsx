"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Hero() {
  const [displayText, setDisplayText] = useState("")
  const [displayEmoji, setDisplayEmoji] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(100)

  const textOptions = [
    { text: "eu Amor", emoji: "❤️" },
    { text: "ua Amizade", emoji: "🤝" },
    { text: "eu Familiar", emoji: "👨‍👩‍👧" },
    { text: "eu Pet", emoji: "🐾" },
    { text: "ua Pessoa Especial", emoji: "✨" },
    { text: "eu Amigo", emoji: "🎭" },
    { text: "eu Noivo", emoji: "🤵🏻‍♂️" },
    { text: "ua Noiva", emoji: "👰🏼‍♀️" },
    { text: "ua Namorada", emoji: "👩🏻" },
    { text: "eu Namorado", emoji: "👱🏼‍♂️" },
    { text: "ua Crush", emoji: "🔥" },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      // Texto atual completo
      const currentOption = textOptions[currentIndex]
      const currentText = currentOption.text

      // Se estamos deletando, remova um caractere
      if (isDeleting) {
        if (displayEmoji) {
          // Se temos emoji, remova-o primeiro
          setDisplayEmoji("")
        } else {
          // Depois remova o texto
          setDisplayText(currentText.substring(0, displayText.length - 1))
        }
        setTypingSpeed(40) // Deletar mais rápido para fluidez
      } else {
        // Se estamos digitando
        if (displayText.length < currentText.length) {
          // Adicione um caractere ao texto
          setDisplayText(currentText.substring(0, displayText.length + 1))
        } else if (!displayEmoji) {
          // Se o texto está completo e não temos emoji, adicione o emoji
          setDisplayEmoji(currentOption.emoji)
        }
        setTypingSpeed(100) // Digitar um pouco mais rápido para fluidez
      }

      // Se terminamos de digitar o texto e o emoji
      if (!isDeleting && displayText === currentText && displayEmoji === currentOption.emoji) {
        // Pausa antes de começar a deletar
        setTypingSpeed(1500)
        setIsDeleting(true)
      }
      // Se terminamos de deletar
      else if (isDeleting && displayText === "" && !displayEmoji) {
        setIsDeleting(false)
        // Avançar para o próximo texto
        setCurrentIndex((currentIndex + 1) % textOptions.length)
        // Pausa antes de começar a digitar o próximo
        setTypingSpeed(300)
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [displayText, displayEmoji, isDeleting, currentIndex, textOptions, typingSpeed])

  return (
    <section className="w-full py-16 md:py-20">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none hero-title">
                <span className="block text-5xl sm:text-6xl xl:text-7xl mb-2">Surpreenda</span>
                <span className="gradient-text text-4xl sm:text-5xl xl:text-6xl">S{displayText}</span>
                {displayEmoji && <span className="emoji text-4xl sm:text-5xl xl:text-6xl"> {displayEmoji}</span>}
                <span className="cursor-blink">|</span>
              </h1>
              <p className="max-w-[600px] text-gray-400 md:text-xl">
                Crie uma página personalizada e receba seu QR Code para compartilhar. Adicione fotos, mensagens e um
                contador dinâmico para tornar o presente ainda mais especial para qualquer pessoa importante em sua
                vida.
              </p>
            </div>
            <div className="flex justify-center sm:justify-start pt-4">
              <Button
                size="lg"
                className="gradient-bg text-lg px-8 py-6"
                onClick={() => document.getElementById("formulario")?.scrollIntoView({ behavior: "smooth" })}
              >
                Começar Agora
              </Button>
            </div>

            {/* Banner flutuante com QR Code e celular */}
            <div className="mt-8 relative">
              <div className="floating-banner">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/E8DA210F-164E-4886-A694-DE18FBC93148-Hg2MR4Yn9GTsUOAOQ3iXuMKduEERBG.png"
                  width={500}
                  height={300}
                  alt="QR Code e celular mostrando página personalizada"
                  className="rounded-lg"
                />

                {/* Corações flutuantes */}
                <div className="heart-small heart-1"></div>
                <div className="heart-small heart-2"></div>
                <div className="heart-small heart-3"></div>
              </div>

              {/* Adicionar após o banner flutuante */}
              <div className="flex items-center justify-center mt-6">
                <div className="flex -space-x-2">
                  {[
                    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-08%20at%202.52.16%20AM-3uiK31KgnlM0CH0oIOj9OWJPGFEo6I.jpeg",
                    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-08%20at%202.41.00%20AM%20%282%29-AXB4RwP2HeliWJjbwo5jppMEyYgXBD.jpeg",
                    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-08%20at%202.41.00%20AM%20%283%29-QPBOH4I6leDO0e8mPIKkwqHnc15xAL.jpeg",
                    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-08%20at%202.41.00%20AM%20%284%29-WSOyTMDgRkIPVvF0Eaivn677IvAtr9.jpeg",
                    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-08%20at%202.41.00%20AM-Mc7oBM3VUk2jKDAfIhM8tnTuQOIPrk.jpeg",
                  ].map((src, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-black overflow-hidden">
                      <Image
                        src={src || "/placeholder.svg"}
                        alt={`Casal feliz ${i + 1}`}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="ml-4 flex items-center">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-400">+ de 3500 clientes felizes</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto aspect-video overflow-hidden rounded-xl lg:order-last">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
