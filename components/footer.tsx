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
              <Link
                href="https://www.facebook.com/profile.php?id=61575515690467"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary"
              >
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
              <Link
                href="https://www.tiktok.com/@amoremcodigooficial"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
                <span className="sr-only">TikTok</span>
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
          <div className="flex justify-center mb-6">
            <img
              src="/images/secure-payment-badge.png"
              alt="Pagamento Seguro via NeonPay"
              className="h-10 opacity-90"
            />
          </div>
          <p className="text-sm text-gray-400 flex items-center justify-center">
            Feito com <Heart className="h-4 w-4 text-red-500 mx-1 fill-current" /> por Amor em Código
          </p>
          <p className="text-xs text-gray-400 mt-2">© 2017-2025 Amor em Código®. Todos os direitos reservados.</p>
          <p className="text-xs text-gray-400 mt-2">CNPJ: 60.289.342/0001-03</p>
        </div>
      </div>
    </footer>
  )
}
