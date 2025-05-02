"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useFormContext } from "@/context/form-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, X, Check, AlertCircle } from "lucide-react"
import { PreviewSite } from "@/components/preview-site"
import { PricingPlans } from "@/components/pricing-plans"
import { nanoid } from "nanoid"

export function Formulario() {
  const { formData, updateFormData, resetForm } = useFormContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("informacoes")
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Gerar um ID único para a página quando o componente é montado
  useEffect(() => {
    if (!formData.pageId) {
      const pageId = nanoid(8) // Gera um ID curto e único
      updateFormData({ pageId })
      // Salvar o ID no localStorage para recuperação posterior
      localStorage.setItem("lastPageId", pageId)
    }
  }, [formData.pageId, updateFormData])

  // Atualizar as URLs das fotos no formData quando photoUrls mudar
  useEffect(() => {
    if (photoUrls.length > 0) {
      updateFormData({ photoUrls })
    }
  }, [photoUrls, updateFormData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    updateFormData({ [name]: value })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Verificar o número máximo de fotos com base no plano
    const maxPhotos = formData.plan === "premium" ? 5 : 1
    if (photoFiles.length + files.length > maxPhotos) {
      setPhotoUploadError(
        `Você pode enviar no máximo ${maxPhotos} foto${maxPhotos > 1 ? "s" : ""} no plano ${formData.plan === "premium" ? "Premium" : "Básico"}.`,
      )
      return
    }

    setUploadingPhotos(true)
    setPhotoUploadError(null)

    try {
      // Adicionar os novos arquivos à lista
      const newFiles = Array.from(files)
      setPhotoFiles((prev) => [...prev, ...newFiles])

      // Converter os arquivos para URLs de dados para preview
      const newUrls = await Promise.all(
        newFiles.map((file) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })
        }),
      )

      // Adicionar as novas URLs à lista
      setPhotoUrls((prev) => [...prev, ...newUrls])
    } catch (error) {
      console.error("Erro ao processar as fotos:", error)
      setPhotoUploadError("Ocorreu um erro ao processar as fotos. Por favor, tente novamente.")
    } finally {
      setUploadingPhotos(false)
      // Limpar o input de arquivo para permitir o upload do mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoUrls((prev) => {
      const newUrls = prev.filter((_, i) => i !== index)
      return newUrls
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    // Validar os campos obrigatórios
    if (!formData.coupleNames || !formData.email || !formData.message || photoUrls.length === 0) {
      setSubmitError("Por favor, preencha todos os campos obrigatórios e envie pelo menos uma foto.")
      setIsSubmitting(false)
      return
    }

    try {
      // Preparar os dados para envio
      const pageData = {
        ...formData,
        photoUrls,
        pageUrl: `${window.location.origin}/pagina/${formData.pageId}`,
      }

      // Enviar os dados para a API
      const response = await fetch("/api/save-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar a página")
      }

      // Sucesso!
      setSubmitSuccess(true)

      // Redirecionar para a página de checkout com base no plano selecionado
      const checkoutUrl =
        formData.plan === "premium"
          ? "https://checkout.neonpay.com.br/checkout/cma699jmn02tgt4xjw8nyh7vh?offer=FO0XZT0"
          : "https://checkout.neonpay.com.br/checkout/cma699jmn02tgt4xjw8nyh7vh?offer=ZSC4E0P"

      window.location.href = checkoutUrl
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error)
      setSubmitError(error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <Tabs defaultValue="informacoes" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="planos">Planos</TabsTrigger>
          <TabsTrigger value="preview" id="preview">
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes" className="space-y-4">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="coupleNames">Nome do Casal</Label>
                <Input
                  id="coupleNames"
                  name="coupleNames"
                  placeholder="Ex: Maria & João"
                  value={formData.coupleNames}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Juntos desde</Label>
                <Input id="date" name="date" type="date" value={formData.date || ""} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-gray-400">Usaremos para enviar o QR Code e Link da sua página</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtubeLink">Link do YouTube (opcional)</Label>
                <Input
                  id="youtubeLink"
                  name="youtubeLink"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.youtubeLink || ""}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-400">Música que tocará ao abrir a página</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Escreva uma mensagem especial..."
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fotos (máx. {formData.plan === "premium" ? "5" : "1"})</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-700">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-black bg-opacity-70 rounded-full p-1"
                      aria-label="Remover foto"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}

                {photoUrls.length < (formData.plan === "premium" ? 5 : 1) && (
                  <div className="aspect-square rounded-md border border-dashed border-gray-700 flex flex-col items-center justify-center p-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhotos}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center w-full h-full"
                      disabled={uploadingPhotos}
                    >
                      {uploadingPhotos ? (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      ) : (
                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      )}
                      <span className="text-xs text-gray-400 text-center">
                        {uploadingPhotos ? "Enviando..." : "Adicionar foto"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
              {photoUploadError && (
                <p className="text-sm text-red-500 mt-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {photoUploadError}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setActiveTab("planos")}>
                Próximo: Escolher Plano
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="planos">
          <PricingPlans />
        </TabsContent>

        <TabsContent value="preview" id="preview-tab">
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Preview da sua página</h3>
                <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                  <PreviewSite />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button className="w-full gradient-bg text-lg py-6" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Finalizar e Ir para Pagamento"
                )}
              </Button>

              {submitError && (
                <div className="bg-red-900/30 border border-red-800 rounded-md p-4 text-red-400 text-sm flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="bg-green-900/30 border border-green-800 rounded-md p-4 text-green-400 text-sm flex items-start">
                  <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Sua página foi criada com sucesso! Redirecionando para o pagamento...</span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
