import { NextResponse } from "next/server"
import { updatePaymentStatus, getPageById } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  console.log("Webhook da Kiwify recebido")

  try {
    // Obter o corpo da requisição como texto para depuração
    const bodyText = await request.text()
    console.log("Corpo da requisição (texto):", bodyText)

    // Tentar analisar o JSON
    let webhookData
    try {
      webhookData = JSON.parse(bodyText)
      console.log("Dados do webhook (JSON):", JSON.stringify(webhookData, null, 2))
    } catch (jsonError) {
      console.error("Erro ao analisar JSON:", jsonError)
      return NextResponse.json({ error: "Formato JSON inválido" }, { status: 400 })
    }

    // Verificar se temos algum dado
    if (!webhookData) {
      console.error("Dados do webhook vazios")
      return NextResponse.json({ error: "Dados do webhook vazios" }, { status: 400 })
    }

    // Extrair a referência e o status de diferentes formatos possíveis
    let reference = null
    let status = null

    // Formato 1: { order: { order_status, order_ref } }
    if (webhookData.order) {
      status = webhookData.order.order_status
      reference = webhookData.order.order_ref
      console.log("Formato 1 detectado: { order: { order_status, order_ref } }")
    }
    // Formato 2: { data: { status, reference } }
    else if (webhookData.data) {
      status = webhookData.data.status
      reference = webhookData.data.reference
      console.log("Formato 2 detectado: { data: { status, reference } }")
    }
    // Formato 3: { status, reference } diretamente no objeto raiz
    else if (webhookData.status && webhookData.reference) {
      status = webhookData.status
      reference = webhookData.reference
      console.log("Formato 3 detectado: { status, reference } no objeto raiz")
    }
    // Formato 4: { transaction: { status, reference } }
    else if (webhookData.transaction) {
      status = webhookData.transaction.status
      reference = webhookData.transaction.reference
      console.log("Formato 4 detectado: { transaction: { status, reference } }")
    }
    // Formato 5: { payment: { status }, order: { reference } }
    else if (webhookData.payment && webhookData.payment.status && webhookData.order && webhookData.order.reference) {
      status = webhookData.payment.status
      reference = webhookData.order.reference
      console.log("Formato 5 detectado: { payment: { status }, order: { reference } }")
    }
    // Formato 6: Tentar encontrar campos com nomes similares em qualquer nível
    else {
      // Função recursiva para procurar propriedades em um objeto
      const findProperty = (obj: any, propNames: string[]): any => {
        if (!obj || typeof obj !== "object") return null

        // Verificar propriedades diretas
        for (const propName of propNames) {
          if (obj[propName] !== undefined) return obj[propName]
        }

        // Verificar propriedades aninhadas
        for (const key in obj) {
          if (typeof obj[key] === "object") {
            const result = findProperty(obj[key], propNames)
            if (result !== null) return result
          }
        }

        return null
      }

      // Procurar status e referência em qualquer lugar do objeto
      status = findProperty(webhookData, ["status", "order_status", "payment_status", "state"])
      reference = findProperty(webhookData, ["reference", "order_ref", "ref", "id", "order_id", "transaction_id"])

      console.log("Formato desconhecido, tentativa de extração: status =", status, "reference =", reference)
    }

    // Verificar se conseguimos extrair os dados necessários
    if (!reference) {
      console.error("Referência (ID da página) não encontrada nos dados do webhook")
      return NextResponse.json(
        {
          error: "Referência (ID da página) não encontrada",
          webhookData,
        },
        { status: 400 },
      )
    }

    if (!status) {
      console.error("Status de pagamento não encontrado nos dados do webhook")
      // Continuar mesmo sem status, usando "processing" como padrão
      status = "processing"
      console.log("Usando status padrão:", status)
    }

    console.log(`Referência extraída: "${reference}" (tipo: ${typeof reference})`)

    // Normalizar a referência (remover espaços, converter para string)
    const normalizedReference = String(reference).trim()
    console.log(`Referência normalizada: "${normalizedReference}"`)

    // Verificar se a página existe antes de tentar atualizar
    try {
      // Buscar os dados da página no Supabase
      const pageData = await getPageById(normalizedReference)

      if (!pageData) {
        console.error(`Página com ID "${normalizedReference}" não encontrada no Supabase`)

        // Tentar listar todas as páginas para depuração
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "",
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        )

        const { data: allPages, error: listError } = await supabase.from("pages").select("page_id").limit(10)

        if (listError) {
          console.error("Erro ao listar páginas:", listError)
        } else {
          console.log("Páginas disponíveis:", allPages)
        }

        // Continuar mesmo sem encontrar a página - apenas atualizar o status
        console.log(`Atualizando status para referência "${normalizedReference}" mesmo sem encontrar a página`)

        try {
          await updatePaymentStatus(normalizedReference, status)
          console.log(`Status atualizado para "${status}" na referência "${normalizedReference}"`)
        } catch (updateError) {
          console.error("Erro ao atualizar status:", updateError)
        }

        return NextResponse.json({
          warning: `Página com ID "${normalizedReference}" não encontrada, mas o status foi atualizado`,
          success: true,
          processedData: {
            reference: normalizedReference,
            status,
          },
        })
      }

      // Se chegou aqui, a página foi encontrada
      console.log(`Página encontrada: ${pageData.couple_names}`)
      console.log(`Atualizando status de pagamento para "${status}"`)

      // Atualizar o status de pagamento no Supabase
      await updatePaymentStatus(normalizedReference, status)

      // Se o pagamento foi aprovado, apenas registrar no log
      if (status === "approved" || status === "paid") {
        console.log(`Pagamento aprovado para página ${normalizedReference}`)
        console.log(`Envio de email pausado temporariamente`)
      }

      return NextResponse.json({
        success: true,
        message: "Webhook processado com sucesso",
        processedData: {
          reference: normalizedReference,
          status,
          coupleName: pageData.couple_names,
        },
      })
    } catch (pageError) {
      console.error("Erro ao buscar página:", pageError)

      return NextResponse.json(
        {
          error: "Erro ao buscar página",
          details: pageError instanceof Error ? pageError.message : String(pageError),
          reference: normalizedReference,
          status,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao processar webhook da Kiwify:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
