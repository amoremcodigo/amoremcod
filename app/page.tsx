import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { Formulario } from "@/components/formulario"
import { PricingPlans } from "@/components/pricing-plans"
import { PreviewSite } from "@/components/preview-site"
import { Testimonials } from "@/components/testimonials"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { WhatsappButton } from "@/components/whatsapp-button"
import { ExampleButton } from "@/components/example-button" // Adicionar importação do novo componente

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />
      <Hero />
      <HowItWorks />
      <Formulario />
      <PricingPlans />
      <PreviewSite />
      <Testimonials />
      <ExampleButton /> {/* Substituir MySitesButton por ExampleButton */}
      <Footer />
      <WhatsappButton />
    </main>
  )
}
