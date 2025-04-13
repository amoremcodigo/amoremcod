import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Política de <span className="gradient-text">Privacidade</span>
            </h1>
            <p className="mt-4 text-gray-400">Como tratamos e protegemos seus dados pessoais.</p>
          </div>

          <div className="prose prose-invert max-w-none">
            <h2>1. Introdução</h2>
            <p>
              Sua privacidade é importante para nós. Esta Política de Privacidade descreve como coletamos, usamos,
              armazenamos e protegemos suas informações pessoais ao utilizar nossa plataforma.
            </p>

            <h2>2. Informações Coletadas</h2>
            <ul>
              <li>
                <strong>Informações de Cadastro:</strong> Nome, data, mensagem personalizada, fotos e e-mail.
              </li>
              <li>
                <strong>Informações de Pagamento:</strong> E-mail cadastrado no Stripe e Mercado Pago.
              </li>
            </ul>

            <h2>3. Uso das Informações</h2>
            <p>Utilizamos suas informações para:</p>
            <ul>
              <li>Processar pagamentos e enviar links personalizados.</li>
              <li>Personalizar e criar páginas para pessoas especiais em sua vida.</li>
              <li>Melhorar nossos serviços e suporte ao cliente.</li>
            </ul>

            <h2>4. Compartilhamento de Informações</h2>
            <p>
              Não compartilhamos suas informações com terceiros, exceto para processar pagamentos e cumprir exigências
              legais.
            </p>

            <h2>5. Medidas de Segurança</h2>
            <p>
              Implementamos medidas de segurança para proteger seus dados contra acesso não autorizado. Embora nos
              esforcemos para proteger suas informações, nenhuma transmissão de dados é 100% segura.
            </p>

            <h2>6. Retenção de Dados</h2>
            <p>
              Reteremos suas informações pelo tempo necessário para cumprir as finalidades ou conforme exigido por lei.
            </p>

            <h2>7. Seus Direitos</h2>
            <p>
              Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Para exercer seus direitos,
              entre em contato pelo e-mail: contato@amoremcodigo.com.br.
            </p>

            <h2>8. Alterações na Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Recomendamos revisar regularmente para estar ciente de
              possíveis alterações.
            </p>

            <h2>9. Contato</h2>
            <p>Para dúvidas ou mais informações, entre em contato pelo e-mail: contato@amoremcodigo.com.br.</p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
