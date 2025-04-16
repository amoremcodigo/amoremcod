import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Componente que usa useSearchParams deve estar dentro de Suspense
function NotFoundContent() {
  return (
    <div className="container py-12 px-4 md:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-6">
          <span className="gradient-text">404</span> - Página não encontrada
        </h1>
        <p className="text-xl text-gray-400 mb-8">Ops! A página que você está procurando não existe ou foi removida.</p>
        <Link href="/">
          <Button size="lg" className="gradient-bg">
            Voltar para a página inicial
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <Suspense
        fallback={
          <div className="container py-12 px-4 md:px-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-400">Carregando...</p>
          </div>
        }
      >
        <NotFoundContent />
      </Suspense>

      <Footer />
    </main>
  )
}
