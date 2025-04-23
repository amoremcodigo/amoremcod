import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Perguntas <span className="gradient-text">Frequentes</span>
            </h1>
            <p className="mt-4 text-gray-400">Encontre respostas para as dúvidas mais comuns sobre o Amor em Código.</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                question: "Como funciona o Amor em Código?",
                answer:
                  "O Amor em Código permite que você crie uma página personalizada para alguém especial com fotos, mensagens e um contador de tempo. Após criar a página, você recebe um QR Code que pode ser compartilhado para acessar a página.",
              },
              {
                question: "Qual a diferença entre os planos?",
                answer:
                  "O Plano Básico (R$ 17,00) oferece uma página com validade de 1 ano, 1 foto e um contador dinâmico. O Plano Premium (R$ 27,00) oferece uma página com validade permanente, até 5 fotos, contador em tempo real e a possibilidade de adicionar uma música do YouTube.",
              },
              {
                question: "Por quanto tempo minha página ficará disponível?",
                answer:
                  "No Plano Básico, sua página ficará disponível por 1 ano. No Plano Premium, sua página ficará disponível permanentemente, sem data de expiração.",
              },
              {
                question: "Posso editar minha página depois de criada?",
                answer:
                  "Sim, você pode editar sua página a qualquer momento fazendo login com o e-mail cadastrado. No entanto, algumas alterações podem ser limitadas dependendo do plano escolhido.",
              },
              {
                question: "Como compartilho minha página?",
                answer:
                  "Após criar sua página, você receberá um QR Code que pode ser baixado ou compartilhado diretamente. Você também receberá um link que pode ser enviado por mensagem. A pessoa pode escanear o QR Code ou clicar no link para acessar a página.",
              },
              {
                question: "Posso adicionar mais fotos depois?",
                answer:
                  "Sim, você pode adicionar mais fotos posteriormente, respeitando o limite do seu plano. O Plano Básico permite 1 foto, enquanto o Plano Premium permite até 5 fotos.",
              },
              {
                question: "Como funciona a música do YouTube?",
                answer:
                  "No Plano Premium, você pode adicionar um link de um vídeo do YouTube que será incorporado à sua página. Quando a pessoa acessar a página, poderá reproduzir a música diretamente.",
              },
              {
                question: "Posso solicitar reembolso?",
                answer:
                  "Oferecemos reembolso em até 7 dias após a compra, desde que a página não tenha sido acessada pelo destinatário. Para solicitar, entre em contato com nosso suporte.",
              },
            ].map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-gray-400">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Ainda tem dúvidas?</h2>
            <p className="text-gray-400 mb-6">Entre em contato com nosso suporte e teremos prazer em ajudar.</p>
            <div className="flex justify-center">
              <a href="mailto:contato@amoremcodigo.com.br" className="text-primary hover:underline">
                contato@amoremcodigo.com.br
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
