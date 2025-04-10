"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"

export function Navbar() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header className="w-full border-b border-gray-800 bg-black/50 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Início
          </Link>
          <button
            onClick={() => scrollToSection("como-funciona")}
            className="text-sm font-medium hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            Como Funciona
          </button>
          <button
            onClick={() => scrollToSection("planos")}
            className="text-sm font-medium hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            Planos
          </button>
        </nav>

        <div className="flex items-center gap-4">{/* Botão removido */}</div>
      </div>
    </header>
  )
}
