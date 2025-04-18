"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PromoBar } from "@/components/promo-bar"
import { Check, Upload } from "lucide-react"

export default function CriarPagina() {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const nextStep = () => {
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      <PromoBar />
      <Navbar />

      <div className="container py-12 px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center">
              Crie sua página <span className="gradient-text">personalizada</span>
            </h1>
            <p className="mt-4 text-center text-gray-400">
              Preencha os dados abaixo para criar uma página especial para alguém importante em sua vida.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center relative">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center z-10">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${step >= i ? "bg-primary" : "bg-gray-800"}`}
                  >
                    {step > i ? <Check className="h-5 w-5 text-white" /> : <span className="text-white">{i}</span>}
                  </div>
                  <span className="text-xs mt-2 text-gray-400">
                    {i === 1 && "Informações"}
                    {i === 2 && "Fotos"}
                    {i === 3 && "Plano"}
                    {i === 4 && "Pagamento"}
                  </span>
                </div>
              ))}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-800">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(step - 1) * 33.33}%` }}
                />
              </div>
            </div>
          </div>

          {step === 1 && (
            <Card className="border-gray-800 bg-black/50">
              <CardHeader>
                <CardTitle>Informações</CardTitle>
                <CardDescription>Preencha os dados básicos para personalizar sua página.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Seu E-mail</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" />
                  <p className="text-xs text-gray-400">Usaremos para enviar o QR Code da sua página.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="names">Nome da Relação</Label>
                  <Input id="names" placeholder="Ex: Maria & João, Família Silva, Eu & Rex..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data de Início da Relação</Label>
                    <Input id="date" type="date" className="bg-transparent" placeholder="dd/mm/aaaa" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário (opcional)</Label>
                    <Input id="time" type="time" className="bg-transparent" placeholder="--:--" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem Especial</Label>
                  <Textarea
                    id="message"
                    placeholder="Escreva uma mensagem especial para essa pessoa..."
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={nextStep}>Próximo Passo</Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-gray-800 bg-black/50">
              <CardHeader>
                <CardTitle>Adicione Fotos</CardTitle>
                <CardDescription>Faça upload de fotos especiais para sua página personalizada.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="border-2 border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center h-40 hover:border-primary transition-colors cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-gray-500 mb-2" />
                      <p className="text-xs text-center text-gray-400">Clique para adicionar foto {i}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  Nota: O plano básico permite apenas 1 foto. O plano premium permite até 5 fotos.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Voltar
                </Button>
                <Button onClick={nextStep}>Próximo Passo</Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-gray-800 bg-black/50">
              <CardHeader>
                <CardTitle>Escolha seu Plano</CardTitle>
                <CardDescription>Selecione o plano que melhor atende às suas necessidades.</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPlan || undefined} onValueChange={setSelectedPlan} className="space-y-4">
                  <div
                    className={`flex items-start space-x-4 rounded-lg border p-4 ${selectedPlan === "basic" ? "border-primary" : "border-gray-800"}`}
                  >
                    <RadioGroupItem value="basic" id="basic" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="basic" className="text-lg font-medium">
                        Plano Básico - R$ 9,90
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">
                        Validade de 1 ano, 1 foto, cronômetro dinâmico de tempo de relacionamento.
                      </p>
                      <ul className="mt-2 space-y-1">
                        <li className="flex items-center text-sm text-gray-400">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Validade de 1 ano
                        </li>
                        <li className="flex items-center text-sm text-gray-400">
                          <Check className="mr-2 h-4 w-4 text-green-500" />1 foto
                        </li>
                        <li className="flex items-center text-sm text-gray-400">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Cronômetro dinâmico
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div
                    className={`flex items-start space-x-4 rounded-lg border p-4 ${selectedPlan === "premium" ? "border-primary" : "border-gray-800"}`}
                  >
                    <RadioGroupItem value="premium" id="premium" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Label htmlFor="premium" className="text-lg font-medium">
                          Plano Premium - R$ 14,90
                        </Label>
                        <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-white rounded-full">Recomendado</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Validade permanente, até 5 fotos, cronômetro em tempo real, música do YouTube.
                      </p>
                      <ul className="mt-2 space-y-1">
                        <li className="flex items-center text-sm text-gray-400">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Validade permanente
                        </li>
                        <li className="flex items-center text-sm text-gray-400">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Até 5 fotos
                        </li>
                        <li className="flex items-center text-sm text-gray-400">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Cronômetro em tempo real
                        </li>
                        <li className="flex items-center text-sm text-gray-400">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          Música do YouTube
                        </li>
                      </ul>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Voltar
                </Button>
                <Button onClick={nextStep} disabled={!selectedPlan}>
                  Próximo Passo
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 4 && (
            <Card className="border-gray-800 bg-black/50">
              <CardHeader>
                <CardTitle>Pagamento</CardTitle>
                <CardDescription>Escolha a forma de pagamento para finalizar sua compra.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="card">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="card">Cartão</TabsTrigger>
                    <TabsTrigger value="pix">Pix</TabsTrigger>
                    <TabsTrigger value="boleto">Boleto</TabsTrigger>
                  </TabsList>
                  <TabsContent value="card" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Número do Cartão</Label>
                      <Input id="card-number" placeholder="0000 0000 0000 0000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Validade</Label>
                        <Input id="expiry" placeholder="MM/AA" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="123" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name-card">Nome no Cartão</Label>
                      <Input id="name-card" placeholder="Nome como está no cartão" />
                    </div>
                  </TabsContent>
                  <TabsContent value="pix" className="mt-4">
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                      <div className="h-48 w-48 bg-white p-4 rounded-lg flex items-center justify-center">
                        <div className="h-40 w-40 bg-gray-200 rounded-lg flex items-center justify-center">
                          <p className="text-black text-sm text-center">QR Code Pix</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 text-center">
                        Escaneie o QR Code acima com o aplicativo do seu banco para pagar.
                      </p>
                      <Button variant="outline" className="w-full">
                        Copiar Código Pix
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="boleto" className="mt-4">
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                      <p className="text-sm text-gray-400 text-center">
                        Ao clicar em "Gerar Boleto", você receberá o boleto por e-mail. O prazo de compensação é de até
                        3 dias úteis.
                      </p>
                      <Button className="w-full">Gerar Boleto</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <div className="w-full flex justify-between items-center py-2 border-t border-gray-800">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-lg">{selectedPlan === "basic" ? "R$ 9,90" : "R$ 14,90"}</span>
                </div>
                <div className="flex justify-between w-full">
                  <Button variant="outline" onClick={prevStep}>
                    Voltar
                  </Button>
                  <Button className="gradient-bg">Finalizar Compra</Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
