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

// Função para salvar uma página no Supabase
export async function savePage(pageData: {
  page_id: string
  email: string
  couple_names: string
  message: string
  youtube_link?: string
  photo_urls: string[]
  plan: string
  page_url: string
  qr_code_url?: string
  payment_status?: string
}) {
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
    return {
      success: false,
      error: "Credenciais do Supabase não configuradas. Impossível salvar dados.",
    }
  }

  // Preparar os dados para inserção - removendo created_at e updated_at
  const dataToInsert = {
    page_id: pageData.page_id,
    email: pageData.email,
    couple_names: pageData.couple_names,
    message: pageData.message,
    youtube_link: pageData.youtube_link || "",
    photo_urls: pageData.photo_urls,
    plan: pageData.plan,
    page_url: pageData.page_url,
    qr_code_url: pageData.qr_code_url || "",
    payment_status: pageData.payment_status || "pending",
    // Removidas as colunas created_at e updated_at
  }

  try {
    // Tentar primeiro com o cliente admin (se disponível)
    if (supabaseServiceKey && supabaseAdmin !== supabase) {
      console.log("Tentando salvar com cliente admin...")
      const { data, error } = await supabaseAdmin.from("pages").insert([dataToInsert]).select()

      if (error) {
        console.error("Erro ao salvar com cliente admin:", error)

        // Se falhar com admin, tentar com cliente normal
        console.log("Tentando salvar com cliente normal...")
        const { data: normalData, error: normalError } = await supabase.from("pages").insert([dataToInsert]).select()

        if (normalError) {
          console.error("Erro ao salvar com cliente normal:", normalError)
          return {
            success: false,
            error: `Falha ao salvar no Supabase: ${normalError.message}`,
          }
        }

        console.log("Página salva com sucesso usando cliente normal")
        return { success: true, data: normalData }
      }

      console.log("Página salva com sucesso usando cliente admin")
      return { success: true, data }
    } else {
      // Se não temos cliente admin, usar o cliente normal
      console.log("Tentando salvar com cliente normal (admin não disponível)...")
      const { data, error } = await supabase.from("pages").insert([dataToInsert]).select()

      if (error) {
        console.error("Erro ao salvar com cliente normal:", error)
        return {
          success: false,
          error: `Falha ao salvar no Supabase: ${error.message}`,
        }
      }

      console.log("Página salva com sucesso usando cliente normal")
      return { success: true, data }
    }
  } catch (error) {
    console.error("FALHA CRÍTICA: Não foi possível salvar a página:", error)
    return {
      success: false,
      error: `Falha ao salvar no Supabase: ${error instanceof Error ? error.message : String(error)}`,
    }
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
      message: "Esta é uma página de teste para debug",
      youtube_link: "",
      photo_urls: ["https://picsum.photos/200/300"],
      plan: "basic",
      page_url: `https://amoremcodigo.com.br/pagina/${testPageId}`,
      qr_code_url: "",
      payment_status: "pending",
      // Removidas as colunas created_at e updated_at
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
      .order("page_id", { ascending: false }) // Alterado para ordenar por page_id em vez de created_at
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
      .update({ payment_status: paymentStatus }) // Removido updated_at
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
      .order("page_id", { ascending: false }) // Alterado para ordenar por page_id em vez de created_at
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
