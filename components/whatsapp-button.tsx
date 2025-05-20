"use client"

import { useState, useEffect, useRef } from "react"

export function WhatsappButton() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Mostrar o botão após um pequeno delay para melhorar a experiência do usuário
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Fechar o menu quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleWhatsAppClick = () => {
    // Ao invés de abrir o WhatsApp diretamente, agora abrimos o menu de opções
    setIsMenuOpen(!isMenuOpen)
  }

  const handleOptionClick = (option: string) => {
    // Número de telefone para o WhatsApp
    const phoneNumber = "5545991021576"

    // Definir a mensagem com base na opção selecionada
    let message = ""
    if (option === "created") {
      message = "Oi! Já criei minha página e preciso de ajuda."
    } else {
      message = "Oi! Ainda não criei minha página e tenho uma dúvida."
    }

    // Criar URL do WhatsApp com o número e mensagem selecionada
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

    // Abrir o WhatsApp em uma nova aba
    window.open(whatsappUrl, "_blank")

    // Fechar o menu
    setIsMenuOpen(false)
  }

  return (
    <div
      ref={menuRef}
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-center transition-all duration-500 ease-in-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
    >
      {/* Menu de opções */}
      {isMenuOpen && (
        <div className="bg-white rounded-lg shadow-xl p-3 mb-3 transform transition-all duration-300 ease-in-out">
          <div className="flex flex-col space-y-2 w-64">
            <button
              onClick={() => handleOptionClick("created")}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              Já criei minha página
            </button>
            <button
              onClick={() => handleOptionClick("not-created")}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              Ainda não criei, tenho uma dúvida
            </button>
          </div>
        </div>
      )}

      {/* Botão principal do WhatsApp */}
      <button
        onClick={handleWhatsAppClick}
        className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 relative group"
        aria-label="Contato via WhatsApp"
      >
        {/* Efeito de pulso */}
        <span className="absolute w-full h-full rounded-full bg-green-500 animate-ping opacity-75"></span>

        {/* Ícone do WhatsApp */}
        <svg className="w-8 h-8 relative z-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>

      {/* Texto abaixo do botão */}
      <div className="bg-white text-green-600 font-semibold text-xs px-3 py-1 rounded-full shadow-md mt-2 whitespace-nowrap">
        Suporte 24hrs!
      </div>
    </div>
  )
}
