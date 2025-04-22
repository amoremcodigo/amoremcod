import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function ExampleButton() {
  return (
    <section className="w-full py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 max-w-3xl">
            <p className="text-gray-400 md:text-lg">
              Veja um modelo fictício de página personalizada já criada, para ter uma ideia de como ficará a sua.
            </p>
          </div>
          <Link
            href="https://www.amoremcodigo.com.br/pagina/a7t970?d=N4IgdiBcIEoIYDM4FMA2ACAZOgMgVwGMBLOMOEAGhABMoQAmABgEYA2AWkYBZ3mBmSiAAudQQFs6+YqTgV0BONTjoxAezHIwQ1ejg6AzsjzpUinUIBOpfQlUWxynQXV4x6ZG6Jhk+gI55kAgBbgDc0ADoAHTAAZSN0fTsLIkT0IlRXL2UNPH10ahJ9OWQEvGUABwsfTQBz5TgFVAcVeOcrGoBj1XD0ABUSxTEiC1U5IRKq-XLkIm13OQaiZuoSoTxqUfRx3TUegHkAI2SAczN0crsE5AsW4wuLOcNjvBH3W5U4IkvK6q1kHoAwup0CFVAQAFdjdY6JAALyuWiIGx6-R2m0MYh+PXY6HgSDQggAnnQABZCITlfSQAD01MJqjwa3CB2Q1OQACk9qx6AB1ADWAHFYQQAKoAfn0RAAvLCAEIAMQAsgARAD6AE0YOwAB6ygBayFVAEUYoJylAANogMkUqm0ojhIgHA7hZzUnDKgAa8oI1AA7vLqXAAJwAdlYBwQAA5g1GAKzBrjhABW5WOghtlJp1IdTpdboOipYIUYQl81PocaQodDwedB2o9BTaYz5Kz9sdztdqjpsoA0oxCdQxITqaxqKwIwRuQdg0hm+mqJm7TnO-mexYBdqxAAJViwsRjghR1ixqvMZD0f6pxfWtsr3Ndt1gRU8vUwOPMZPUlaV4OMUM+EYOM+GoBcQAAXSocpUDoH4hlcEAAF8gA"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="mt-4 gradient-bg flex items-center gap-2">
              <ExternalLink className="mr-2 h-5 w-5" />
              Ver Exemplo Pronto
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
