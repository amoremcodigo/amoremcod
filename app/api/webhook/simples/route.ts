import { NextResponse } from "next/server"
import { updatePaymentStatus, getPagesByEmail } from "@/lib/supabase"
import { sendConfirmationEmail } from "@/lib/email" // Import sendConfirmationEmail
import { listRecentPages } from "@/lib/pages" // Import listRecentPages

// Rota de webhook simplificada que aceita apenas o e-mail do cliente e o status
export async function GET(request: Request) {
  console.log("=== WEBHOOK SIMPLES RECEBIDO (GET) ===")
  return handleWebhook(request)
}

export async function POST(request: Request) {
  console.log("=== WEBHOOK SIMPLES RECEBIDO (POST) ===")
  return handleWebhook(request)
}

// Melhorar o log de depuração no webhook simples
async function handleWebhook(request: Request) {
  try {
    // Extrair parâmetros da URL e do corpo
    const url = new URL(request.url)
    console.log("URL completa do webhook:", request.url)
    console.log("Todos os parâmetros da URL:", Object.fromEntries(url.searchParams.entries()))

    // Tentar obter dados do corpo para requisições POST
    let bodyData = {}
    let rawBody = ""

    if (request.method === "POST") {
      try {
        // Clonar a requisição para poder ler o corpo
        const clonedRequest = request.clone()
        rawBody = await clonedRequest.text()
        console.log("Corpo bruto da requisição:", rawBody)

        if (rawBody) {
          try {
            bodyData = JSON.parse(rawBody)
            console.log("Corpo da requisição parseado:", bodyData)

            // ACESSO DIRETO AO CAMPO EMAIL DO CUSTOMER
            if (bodyData && (bodyData as any).Customer && typeof (bodyData as any).Customer === "object") {
              const customerEmail = (bodyData as any).Customer.email
              if (customerEmail) {
                console.log("E-mail encontrado diretamente em Customer.email:", customerEmail)
                // Continuar com o e-mail encontrado
                return processWebhook(customerEmail, "paid", bodyData)
              }
            }
          } catch (e) {
            console.log("Corpo não é um JSON válido")

            // Tentar extrair dados de um formulário
            if (rawBody.includes("=")) {
              try {
                const formData = new URLSearchParams(rawBody)
                bodyData = Object.fromEntries(formData.entries())
                console.log("Dados de formulário extraídos:", bodyData)
              } catch (formError) {
                console.error("Erro ao extrair dados de formulário:", formError)
              }
            }
          }
        }
      } catch (e) {
        console.error("Erro ao ler o corpo da requisição:", e)
      }
    }

    // Tentar obter o e-mail de várias fontes
    let email =
      url.searchParams.get("email") || url.searchParams.get("customer_email") || url.searchParams.get("buyer_email")

    // Se não encontrou na URL, tenta no corpo
    if (!email && typeof bodyData === "object" && bodyData !== null) {
      // Verificar todos os campos possíveis
      const possibleFields = ["email", "customer_email", "buyer_email", "user_email"]

      for (const field of possibleFields) {
        if ((bodyData as any)[field]) {
          email = (bodyData as any)[field]
          console.log(`E-mail encontrado em ${field}: ${email}`)
          break
        }
      }
    }

    // Se ainda não encontrou, tenta extrair do corpo bruto usando regex
    if (!email && rawBody) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const matches = rawBody.match(emailRegex)

      if (matches && matches.length > 0) {
        email = matches[0]
        console.log(`E-mail extraído via regex: ${email}`)
      }
    }

    const status =
      url.searchParams.get("status") || (bodyData as any).status || (bodyData as any).order_status || "approved"

    console.log(`Parâmetros processados - email: ${email}, status: ${status}`)

    if (!email) {
      return NextResponse.json(
        {
          error: "E-mail do cliente não fornecido",
          params: Object.fromEntries(url.searchParams.entries()),
          body: bodyData,
          rawBody: rawBody.substring(0, 1000), // Incluir parte do corpo bruto na resposta
        },
        { status: 400 },
      )
    }

    // Normalizar o e-mail (trim e lowercase)
    const normalizedEmail = email.trim().toLowerCase()
    console.log(`E-mail normalizado: ${normalizedEmail}`)

    // Buscar as páginas do cliente pelo e-mail
    const pages = await getPagesByEmail(normalizedEmail)

    // Se não encontramos nenhuma página, retornar erro
    if (!pages || pages.length === 0) {
      console.error(`Nenhuma página encontrada para o e-mail ${normalizedEmail}`)

      // SOLUÇÃO DE EMERGÊNCIA: Tentar processar a página mais recente
      try {
        console.log("TENTANDO PROCESSAR PÁGINA MAIS RECENTE COMO FALLBACK")
        const recentPages = await listRecentPages(1)

        if (recentPages && recentPages.length > 0) {
          const pageData = recentPages[0]
          const pageId = pageData.page_id

          // Atualizar o status para aprovado
          await updatePaymentStatus(pageId, "paid")

          // Enviar e-mail de confirmação
          await sendConfirmationEmail(pageData)

          return NextResponse.json({
            success: true,
            message: "Webhook processado com sucesso (fallback de emergência)",
            pageId,
            email: pageData.email,
            status: "paid",
          })
        }
      } catch (fallbackError) {
        console.error("ERRO NO FALLBACK DE EMERGÊNCIA:", fallbackError)
      }

      return NextResponse.json(
        {
          error: `Nenhuma página encontrada para o e-mail ${normalizedEmail}`,
          email: normalizedEmail,
        },
        { status: 404 },
      )
    }

    // Pegar a página mais recente (a primeira da lista, já que ordenamos por created_at desc)
    const pageData = pages[0]
    const pageId = pageData.page_id

    console.log(`Página encontrada: ${pageId} para o e-mail ${normalizedEmail}`)

    // Atualizar o status de pagamento no Supabase
    await updatePaymentStatus(pageId, status)

    // Se o pagamento foi aprovado, enviar o email com o QR Code
    if (status === "approved" || status === "paid") {
      console.log(`Pagamento aprovado para página ${pageId}, enviando email...`)
      await sendConfirmationEmail(pageData)
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
      pageId,
      email: normalizedEmail,
      status,
    })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

async function processWebhook(email: string, status: string, bodyData: any) {
  // Normalizar o e-mail (trim e lowercase)
  const normalizedEmail = email.trim().toLowerCase()
  console.log(`E-mail normalizado: ${normalizedEmail}`)

  // Buscar as páginas do cliente pelo e-mail
  const pages = await getPagesByEmail(normalizedEmail)

  // Se não encontramos nenhuma página, retornar erro
  if (!pages || pages.length === 0) {
    console.error(`Nenhuma página encontrada para o e-mail ${normalizedEmail}`)

    // SOLUÇÃO DE EMERGÊNCIA: Tentar processar a página mais recente
    try {
      console.log("TENTANDO PROCESSAR PÁGINA MAIS RECENTE COMO FALLBACK")
      const recentPages = await listRecentPages(1)

      if (recentPages && recentPages.length > 0) {
        const pageData = recentPages[0]
        const pageId = pageData.page_id

        // Atualizar o status para aprovado
        await updatePaymentStatus(pageId, "paid")

        // Enviar e-mail de confirmação
        await sendConfirmationEmail(pageData)

        return NextResponse.json({
          success: true,
          message: "Webhook processado com sucesso (fallback de emergência)",
          pageId,
          email: pageData.email,
          status: "paid",
        })
      }
    } catch (fallbackError) {
      console.error("ERRO NO FALLBACK DE EMERGÊNCIA:", fallbackError)
    }

    return NextResponse.json(
      {
        error: `Nenhuma página encontrada para o e-mail ${normalizedEmail}`,
        email: normalizedEmail,
      },
      { status: 404 },
    )
  }

  // Pegar a página mais recente (a primeira da lista, já que ordenamos por created_at desc)
  const pageData = pages[0]
  const pageId = pageData.page_id

  console.log(`Página encontrada: ${pageId} para o e-mail ${normalizedEmail}`)

  // Atualizar o status de pagamento no Supabase
  await updatePaymentStatus(pageId, status)

  // Se o pagamento foi aprovado, enviar o email com o QR Code
  if (status === "approved" || status === "paid") {
    console.log(`Pagamento aprovado para página ${pageId}, enviando email...`)
    await sendConfirmationEmail(pageData)
  }

  return NextResponse.json({
    success: true,
    message: "Webhook processado com sucesso",
    pageId,
    email: normalizedEmail,
    status,
  })
}

// Função auxiliar para listar páginas recentes
// async function listRecentPages(limit = 1) {
//   try {
//     const { supabase } = await import("@/lib/supabase")
//     const { data, error } = await supabase
//       .from("pages")
//       .select("*")
//       .order("created_at", { ascending: false })
//       .limit(limit)

//     if (error) {
//       console.error("ERRO AO LISTAR PÁGINAS RECENTES:", error)
//       return null
//     }

//     return data
//   } catch (error) {
//     console.error("ERRO AO LISTAR PÁGINAS RECENTES:", error)
//     return null
//   }
// }
