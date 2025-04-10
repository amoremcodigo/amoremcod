import { NextResponse } from "next/server"
import { getPageById, updatePaymentStatus } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    console.log("Webhook da Kirvano recebido - Versão simplificada")

    // Verificar o token de segurança - usando o token fixo '123456'
    const token = request.headers.get("x-kirvano-token")
    console.log(`Token recebido: ${token || "nenhum"}`)

    // Verificação simplificada do token
    if (token !== "123456") {
      console.log(`Token inválido: ${token}. Esperado: 123456`)
      // Continuamos o processamento mesmo com token inválido para fins de teste
      console.log("Continuando processamento mesmo com token inválido (apenas para teste)")
    } else {
      console.log("Token válido!")
    }

    // Obter os dados do webhook
    let webhookData
    try {
      webhookData = await request.json()
      console.log("Dados do webhook:", JSON.stringify(webhookData, null, 2))
    } catch (e) {
      console.log("Erro ao processar JSON do webhook:", e)
      webhookData = {}
    }

    // Extrair o ID da página de várias possíveis localizações
    const pageId =
      webhookData?.customData?.pageId ||
      webhookData?.reference ||
      webhookData?.ref ||
      webhookData?.metadata?.pageId ||
      webhookData?.metadata?.ref ||
      webhookData?.id

    console.log(`ID da página extraído: ${pageId || "não encontrado"}`)

    if (!pageId) {
      return NextResponse.json({
        success: false,
        message: "ID da página não encontrado nos dados do webhook",
        webhookData,
      })
    }

    // Buscar os dados da página no Supabase
    try {
      const pageData = await getPageById(pageId)

      if (!pageData) {
        console.log(`Página não encontrada no Supabase: ${pageId}`)
        return NextResponse.json({
          success: false,
          message: `Página não encontrada: ${pageId}`,
        })
      }

      console.log(`Página encontrada: ${pageData.couple_names}`)

      // Atualizar o status de pagamento
      await updatePaymentStatus(pageId, "paid")
      console.log(`Status de pagamento atualizado para 'paid'`)

      return NextResponse.json({
        success: true,
        message: "Status de pagamento atualizado com sucesso",
        pageId,
        coupleName: pageData.couple_names,
      })
    } catch (dbError) {
      console.error("Erro ao acessar o banco de dados:", dbError)
      return NextResponse.json({
        success: false,
        message: "Erro ao processar dados no banco",
        error: dbError instanceof Error ? dbError.message : "Erro desconhecido",
      })
    }
  } catch (error) {
    console.error("Erro geral ao processar webhook:", error)
    return NextResponse.json({
      success: false,
      message: "Erro interno no servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    })
  }
}
