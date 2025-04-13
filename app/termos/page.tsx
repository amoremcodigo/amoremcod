import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Termos de <span className="gradient-text">Uso</span>
            </h1>
            <p className="mt-4 text-gray-400">
              Leia atentamente os termos e condições para utilização da nossa plataforma.
            </p>
          </div>

          <div className="prose prose-invert max-w-none">
            <h2>1. Introdução</h2>
            <p>
              Bem-vindo ao Amor em Código, uma plataforma criada para ajudar você a eternizar momentos especiais por
              meio de páginas personalizadas para qualquer pessoa importante em sua vida. Nosso objetivo é oferecer uma
              experiência única e significativa para nossos usuários.
            </p>

            <h2>2. Idiomas Suportados</h2>
            <p>Português (pt)</p>

            <h2>3. Requisitos para Uso</h2>
            <p>
              Para utilizar o Amor em Código, é necessário fornecer informações precisas ao preencher os formulários de
              personalização.
            </p>

            <h2>4. Recursos Disponíveis</h2>
            <h3>4.1 Personalização de Websites</h3>
            <p>
              Os usuários podem criar páginas personalizadas adicionando títulos, imagens, mensagens, emojis, contadores
              dinâmicos e músicas para tornar cada website especial.
            </p>

            <h3>4.2 Compartilhamento de Websites</h3>
            <p>
              Após a criação e o pagamento, você receberá um link único e um QR Code para compartilhar sua website com
              quem desejar.
            </p>

            <h3>4.3 Formas de Pagamento</h3>
            <p>
              O Amor em Código aceita pagamentos via Cartão de Crédito e PIX. As transações são processadas
              imediatamente, e o link/QR Code será enviado automaticamente para o e-mail cadastrado.
            </p>

            <h2>5. Planos e Validade</h2>
            <p>O Amor em Código oferece diferentes planos, variando conforme os recursos disponíveis:</p>
            <ul>
              <li>
                <strong>Plano Básico:</strong> Inclui 1 foto e tem validade de 1 ano.
              </li>
              <li>
                <strong>Plano Premium:</strong> Inclui até 5 fotos e possui validade vitalícia.
              </li>
            </ul>

            <h2>6. Política de Reembolsos</h2>
            <p>
              Não realizamos reembolsos após a confirmação do pagamento e envio do link/QR Code, salvo em casos
              excepcionais de erro comprovado no sistema.
            </p>

            <h2>7. Responsabilidade do Usuário</h2>
            <p>
              O usuário é responsável por manter seguras as informações recebidas (link e QR Code) e garantir que as
              mensagens e imagens enviadas não violem direitos de terceiros ou contenham conteúdo inadequado.
            </p>

            <h2>8. Direitos Autorais e Propriedade Intelectual</h2>
            <p>
              Todos os direitos sobre a plataforma, incluindo textos, imagens e logotipos, pertencem ao Amor em Código.
              Qualquer reprodução, cópia ou redistribuição sem autorização prévia é proibida.
            </p>

            <h2>9. Suporte ao Cliente</h2>
            <p>
              Para dúvidas ou problemas, entre em contato com nossa equipe de suporte pelo e-mail
              contato@amoremcodigo.com.br.
            </p>

            <h2>10. Alterações nos Termos de Uso</h2>
            <p>
              Podemos atualizar estes Termos de Uso periodicamente. Recomendamos que você revise esta página
              regularmente para se manter informado sobre possíveis alterações.
            </p>

            <h2>11. Contato</h2>
            <p>
              Caso tenha dúvidas ou precise de mais informações, entre em contato conosco pelo e-mail
              contato@amoremcodigo.com.br.
            </p>

            <h2>12. Disposições Gerais</h2>
            <p>
              Ao utilizar o Amor em Código, você concorda com estes Termos de Uso e com nossa Política de Privacidade.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
