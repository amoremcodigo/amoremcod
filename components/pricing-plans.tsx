"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useFormContext } from "@/context/form-context"

export function PricingPlans() {
  const { formData, updateFormData } = useFormContext()

  const selectPlan = (plan: "basic" | "premium") => {
    console.log(`Selecionando plano: ${plan}`)
    updateFormData({ plan })

    // Rolar para a seção de preview
    setTimeout(() => {
      document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  return (
    <section className="w-full py-10 md:py-16 lg:py-20" id="planos">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Escolha o plano <span className="gradient-text">ideal</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Temos opções para todos os casais, escolha a que melhor se adapta às suas necessidades.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8 mt-8 md:mt-10">
          {[
            {
              title: "Plano Básico",
              price: "R$ 19,90",
              description: "Perfeito para uma surpresa especial",
              features: [
                { text: "Validade de 1 ano", included: true },
                { text: "1 foto", included: true },
                { text: "Cronômetro dinâmico", included: true },
                { text: "Música do YouTube", included: false },
                { text: "Múltiplas fotos", included: false },
              ],
              popular: false,
              id: "basic",
            },
            {
              title: "Plano Premium",
              price: "R$ 39,90",
              originalPrice: "R$ 79,80",
              discount: "50% OFF",
              description: "Para eternizar momentos especiais",
              features: [
                { text: "Validade permanente", included: true },
                { text: "Até 5 fotos", included: true },
                { text: "Cronômetro dinâmico em tempo real", included: true },
                { text: "Música do YouTube", included: true },
                { text: "Atualizações gratuitas", included: true },
              ],
              popular: true,
              id: "premium",
            },
          ].map((plan, index) => (
            <Card
              key={index}
              className={`flex flex-col relative ${plan.popular && formData.plan !== plan.id ? "border-gray-800" : ""} ${
                formData.plan === plan.id ? "ring-2 ring-primary border-primary" : "border-gray-800"
              } bg-black/50 cursor-pointer hover:border-primary transition-colors`}
              onClick={() => selectPlan(plan.id as "basic" | "premium")}
            >
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                {plan.popular && (
                  <div className="absolute -top-2 -right-2 flex flex-col items-end gap-2 z-10">
                    <div className="px-3 py-1 text-xs bg-primary text-white rounded-full shadow-md">RECOMENDADO</div>
                    {plan.discount && (
                      <div className="px-3 py-1 text-xs bg-green-600 text-white rounded-full shadow-md">
                        {plan.discount}
                      </div>
                    )}
                  </div>
                )}
                <CardTitle className="text-xl sm:text-2xl">{plan.title}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex flex-wrap items-baseline text-gray-100">
                  {plan.originalPrice && (
                    <span className="text-base sm:text-lg line-through text-gray-500 mr-2">{plan.originalPrice}</span>
                  )}
                  <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-xs sm:text-sm text-gray-400 w-full sm:w-auto mt-1 sm:mt-0">
                    Pagamento único
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 px-4 py-1 sm:px-6 sm:py-2">
                <ul className="space-y-1 sm:space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm sm:text-base">
                      {feature.included ? (
                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "text-gray-200" : "text-gray-500"}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-4 py-3 sm:px-6 sm:py-4">
                <Button
                  className={`w-full ${plan.popular ? "gradient-bg" : ""} ${formData.plan === plan.id ? "bg-primary" : ""}`}
                >
                  {formData.plan === plan.id ? "Plano Selecionado" : "Escolher Plano"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
