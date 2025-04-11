import { NextResponse } from "next/server"
import { updatePaymentStatus, getPageById } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // Extrair dados do corpo da requisição
    const { pageId } = await request.json()

    if (!pageId) {
      return NextResponse.json({ error: "ID da página não fornecido" }, { status: 400 })
    }

    console.log(`Verificando status de pagamento para página ${pageId}`)

    // Buscar os dados da página no Supabase
    const pageData = await getPageById(pageId)

    if (!pageData) {
      console.error(`Página ${pageId} não encontrada`)
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 })
    }

    // Verificar o status atual
    const currentStatus = pageData.payment_status || "pending"

    // Se já estiver pago, não precisa verificar novamente
    if (currentStatus === "approved" || currentStatus === "paid") {
      return NextResponse.json({
        success: true,
        status: currentStatus,
        message: "Pagamento já confirmado",
      })
    }

    // Obter a chave de API da Kiwify
    const kiwifyApiKey = process.env.KIWIFY_API_KEY

    if (!kiwifyApiKey) {
      console.error("Chave de API da Kiwify não configurada")
      return NextResponse.json({ error: "Configuração de API ausente" }, { status: 500 })
    }

    // Verificar o status do pagamento na API da Kiwify
    // Usando a API real da Kiwify com a chave fornecida
    const response = await fetch(`https://api.kiwify.com.br/v1/sales?reference=${pageId}`, {
      headers: {
        Authorization: `Bearer ${kiwifyApiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Erro ao consultar API da Kiwify: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error(`Resposta de erro: ${errorText}`)

      return NextResponse.json(
        {
          error: "Erro ao consultar API da Kiwify",
          status: response.status,
          details: errorText,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("Resposta da API da Kiwify:", JSON.stringify(data, null, 2))

    // Verificar se encontrou alguma transação
    if (!data.data || data.data.length === 0) {
      console.log(`Nenhuma transação encontrada para a página ${pageId}`)
      return NextResponse.json({
        status: "pending",
        message: "Nenhuma transação encontrada",
      })
    }

    // Obter a transação mais recente
    const transaction = data.data[0]
    const paymentStatus = transaction.status

    // Se o status não mudou, retornar o status atual
    if (paymentStatus === currentStatus) {
      return NextResponse.json({
        success: true,
        status: paymentStatus,
        message: "Status não alterado",
      })
    }

    // Atualizar o status no Supabase
    await updatePaymentStatus(pageId, paymentStatus)

    // Se o pagamento foi aprovado, apenas registrar no log
    if (paymentStatus === "approved" || paymentStatus === "paid") {
      console.log(`Pagamento aprovado para página ${pageId}`)
      console.log(`Envio de email pausado temporariamente`)
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
      pageId: pageId,
      message: "Status atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
