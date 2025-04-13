import { Heart, QrCode, ImageIcon, Clock, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HowItWorks() {
  return (
    <section className="w-full py-16 md:py-20" id="como-funciona">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Crie uma página em <span className="gradient-text">4 etapas!</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">É rapidinho, dura menos de 3 minutos!</p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-10">
          {[
            {
              icon: <Heart className="h-10 w-10 text-pink-500" />,
              title: "Preencha os dados",
            },
            {
              icon: <ImageIcon className="h-10 w-10 text-blue-500" />,
              title: "Adicione fotos",
            },
            {
              icon: <Clock className="h-10 w-10 text-green-500" />,
              title: "Escolha um plano",
            },
            {
              icon: <QrCode className="h-10 w-10 text-purple-500" />,
              title: "Receba o QR Code",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-black/50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900">{item.icon}</div>
              <h3 className="text-xl font-bold">{item.title}</h3>
            </div>
          ))}
        </div>

        {/* Botão de exemplo após os boxes */}
        <div className="flex justify-center mt-10">
          <a
            href="https://www.amoremcodigo.com.br/pagina/a7t970?d=N4IgdiBcIEoIYDM4FMA2ACAZOgMgVwGMBLOMOEAGhABMoQAmABgEYA2AWkYBZ3mBmSiAAudQQFs6+YqTgV0BONTjoxAezHIwQ1ejg6AzsjzpUinUIBOpfQlUWxynQXV4x6ZG6Jhk+gI55kAgBbgDc0ADoAHTAAZSN0fTsLIkT0IlRXL2UNPH10ahJ9OWQEvGUABwsfTQBz5TgFVAcVeOcrGoBj1XD0ABUSxTEiC1U5IRKq-XLkIm13OQaiZuoSoTxqUfRx3TUegHkAI2SAczN0crsE5AsW4wuLOcNjvBH3W5U4IkvK6q1kHoAwup0CFVAQAFdjdY6JAALyuWiIGx6-R2m0MYh+PXY6HgSDQggAnnQABZCITlfSQAD01MJqjwa3CB2Q1OQACk9qx6AB1ADWAHFYQQAKoAfn0RAAvLCAEIAMQAsgARAD6AE0YOwAB6ygBayFVAEUYoJylAANogMkUqm0ojhIgHA7hZzUnDKgAa8oI1AA7vLqXAAJwAdlYBwQAA5g1GAKzBrjhABW5WOghtlJp1IdTpdboOipYIUYQl81PocaQodDwedB2o9BTaYz5Kz9sdztdqjpsoA0oxCdQxITqaxqKwIwRuQdg0hm+mqJm7TnO-mexYBdqxAAJViwsRjghR1ixqvMZD0f6pxfWtsr3Ndt1gRU8vUwOPMZPUlaV4OMUM+EYOM+GoBcQAAXSocpUDoH4hlcEAAF8gA"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="gradient-bg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Ver Exemplo Pronto
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}
