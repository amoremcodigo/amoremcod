import { Logo } from "@/components/logo"
import Link from "next/link"
import { Facebook, Instagram, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 bg-black py-16">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col space-y-4">
            <Logo />
            <p className="text-sm text-gray-400">
              Eternize momentos especiais com páginas personalizadas para pessoas importantes em sua vida.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="https://www.instagram.com/amoremcodigooficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-medium">Legal</h3>
            <Link href="/termos" className="text-sm text-gray-400 hover:text-primary">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-sm text-gray-400 hover:text-primary">
              Política de Privacidade
            </Link>
            <Link href="/faq" className="text-sm text-gray-400 hover:text-primary">
              Perguntas Frequentes
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-400 flex items-center justify-center">
            Feito com <Heart className="h-4 w-4 text-red-500 mx-1 fill-current" /> por Amor em Código
          </p>
          <p className="text-xs text-gray-400 mt-2">CNPJ: 60.289.342/0001-03</p>
        </div>
      </div>
    </footer>
  )
}
