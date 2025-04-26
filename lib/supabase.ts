import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO CRÍTICO: Variáveis de ambiente do Supabase não estão configuradas corretamente")
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "Definido" : "Não definido"}`)
  console.error(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "Definido" : "Não definido"}`)
}

// Criar o cliente do Supabase
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: false, // Não persistir a sessão para evitar problemas de cache
  },
  db: {
    schema: "public",
  },
})

// Criar um cliente com a chave de serviço para operações administrativas
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl || "", supabaseServiceKey, {
      auth: {
        persistSession: false, // Não persistir a sessão para evitar problemas de cache
      },
      db: {
        schema: "public",
      },
    })
  : supabase

// Função auxiliar para tentar salvar com retry
async function trySaveWithRetry(
  client: any,
  dataToInsert: any,
  retryCount: number,
  maxRetries: number,
  clientType: string,
): Promise<any> {
  try {
    console.log(`Tentativa ${retryCount + 1}/${maxRetries} de salvar página usando cliente ${clientType}`)
    const { data, error } = await client.from("pages").insert([dataToInsert]).select()

    if (error) {
      console.error(
        `Erro ao salvar página com cliente ${clientType} (tentativa ${retryCount + 1}/${maxRetries}):`,
        error,
      )
      throw error
    }

    console.log(`Página salva com sucesso usando cliente ${clientType} (tentativa ${retryCount + 1}/${maxRetries})`)
    return { success: true, data }
  } catch (error) {
    if (retryCount < maxRetries - 1) {
      // Espera exponencial entre tentativas
      const waitTime = Math.pow(2, retryCount) * 1000
      console.log(`Aguardando ${waitTime}ms antes da próxima tentativa...`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      return trySaveWithRetry(client, dataToInsert, retryCount + 1, maxRetries, clientType)
    }
    throw error
  }
}

// Função para salvar uma página no Supabase
export async function savePage(pageData: {
  page_id: string
  email: string
  couple_names: string
  date: string
  time?: string
  message: string
  youtube_link?: string
  photo_urls: string[]
  plan: string
  page_url: string
  qr_code_url?: string
  payment_status?: string
}) {
  const maxRetries = 5

  console.log("=== INICIANDO SALVAMENTO DE PÁGINA NO SUPABASE ===")
  console.log("ID da página:", pageData.page_id)
  console.log("Email:", pageData.email)
  console.log("Nome do casal:", pageData.couple_names)
  console.log("Plano:", pageData.plan)
  console.log("URLs das fotos:", pageData.photo_urls.length)
  console.log("Status de pagamento:", pageData.payment_status || "pending")
  console.log("Supabase URL:", supabaseUrl ? "Configurado" : "NÃO CONFIGURADO")
  console.log("Supabase Anon Key:", supabaseAnonKey ? "Configurado" : "NÃO CONFIGURADO")
  console.log("Supabase Service Key:", supabaseServiceKey ? "Configurado" : "NÃO CONFIGURADO")

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO CRÍTICO: Credenciais do Supabase não configuradas")
    throw new Error("Credenciais do Supabase não configuradas. Impossível salvar dados.")
  }

  // Preparar os dados para inserção, incluindo os timestamps
  const now = new Date().toISOString()
  const dataToInsert = {
    page_id: pageData.page_id,
    email: pageData.email,
    couple_names: pageData.couple_names,
    date: pageData.date,
    time: pageData.time || "",
    message: pageData.message,
    youtube_link: pageData.youtube_link || "",
    photo_urls: pageData.photo_urls,
    plan: pageData.plan,
    page_url: pageData.page_url,
    qr_code_url: pageData.qr_code_url || "",
    payment_status: pageData.payment_status || "pending",
    created_at: now,
    updated_at: now,
  }

  try {
    // Tentar primeiro com o cliente admin (se disponível)
    if (supabaseServiceKey && supabaseAdmin !== supabase) {
      try {
        return await trySaveWithRetry(supabaseAdmin, dataToInsert, 0, maxRetries, "admin")
      } catch (adminError) {
        console.error("Todas as tentativas com cliente admin falharam, tentando com cliente normal...")
        // Se falhar com admin, tentar com cliente normal
        return await trySaveWithRetry(supabase, dataToInsert, 0, maxRetries, "normal")
      }
    } else {
      // Se não temos cliente admin, usar o cliente normal
      return await trySaveWithRetry(supabase, dataToInsert, 0, maxRetries, "normal")
    }
  } catch (error) {
    console.error(`FALHA CRÍTICA: Não foi possível salvar a página após ${maxRetries} tentativas:`, error)
    throw new Error(
      `Falha ao salvar no Supabase após ${maxRetries} tentativas: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

// Função para criar uma página de teste
export async function createTestPage() {
  try {
    const testPageId = `test-${Date.now()}`
    const testPage = {
      page_id: testPageId,
      email: "teste@exemplo.com",
      couple_names: "Teste & Debug",
      date: new Date().toISOString().split("T")[0],
      time: "12:00:00",
      message: "Esta é uma página de teste para debug",
      youtube_link: "",
      photo_urls: ["https://picsum.photos/200/300"],
      plan: "basic",
      page_url: `https://amoremcodigo.com.br/pagina/${testPageId}`,
      qr_code_url: "",
      payment_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("pages").insert([testPage]).select()

    if (error) {
      console.error("Erro ao criar página de teste:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Erro ao criar página de teste:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Função para listar todas as páginas
export async function listAllPages(limit = 100) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Erro ao listar páginas:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro ao listar páginas:", error)
    return null
  }
}

// Função para atualizar o status de pagamento de uma página
export async function updatePaymentStatus(pageId: string, paymentStatus: string) {
  try {
    console.log(`Atualizando status de pagamento para página ${pageId} para ${paymentStatus}`)

    const { data, error } = await supabase
      .from("pages")
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq("page_id", pageId)
      .select()

    if (error) {
      console.error(`Erro ao atualizar status de pagamento para página ${pageId}:`, error)
      throw error
    }

    console.log(`Status de pagamento atualizado com sucesso para página ${pageId}`)
    return data
  } catch (error) {
    console.error(`Erro ao atualizar status de pagamento para página ${pageId}:`, error)
    throw error
  }
}

// Função para buscar uma página pelo ID
export async function getPageById(pageId: string) {
  try {
    const { data, error } = await supabase.from("pages").select("*").eq("page_id", pageId).single()

    if (error) {
      console.error(`Erro ao buscar página com ID ${pageId}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Erro ao buscar página com ID ${pageId}:`, error)
    return null
  }
}

// Função para buscar páginas pelo e-mail
export async function getPagesByEmail(email: string, limit = 5) {
  try {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`Erro ao buscar páginas com email ${email}:`, error)
      return null
    }

    return data
  } catch (error) {
    console.error(`Erro ao buscar páginas com email ${email}:`, error)
    return null
  }
}
