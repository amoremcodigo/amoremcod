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

// Função para salvar uma página no Supabase - simplificada para uma única tentativa
export async function savePage(pageData: {
  page_id: string
  email: string
  couple_names: string
  date: string
  time?: string // Mantido na interface, mas não será usado
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

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Credenciais do Supabase não configuradas. Impossível salvar dados.")
    throw new Error("Credenciais do Supabase não configuradas")
  }

  // Preparar os dados para inserção, removendo campos problemáticos
  const now = new Date().toISOString()

  // Criar uma cópia dos dados sem o campo time
  const { time, created_at, ...dataWithoutTime } = pageData

  const dataToInsert = {
    ...dataWithoutTime,
    updated_at: now,
    // Removido o campo time e created_at
  }

  console.log("Dados preparados para inserção (sem campo time):", Object.keys(dataToInsert).join(", "))

  // Tentar primeiro com o cliente admin (se disponível)
  if (supabaseServiceKey && supabaseAdmin !== supabase) {
    console.log("Usando cliente admin para salvar página")
    const { error } = await supabaseAdmin.from("pages").insert([dataToInsert])

    if (error) {
      console.error("Erro com cliente admin:", error)
      console.log("Tentando com cliente normal...")

      // Se falhar com admin, tentar com cliente normal
      const { error: normalError } = await supabase.from("pages").insert([dataToInsert])

      if (normalError) {
        console.error("Erro com cliente normal:", normalError)
        throw normalError
      }

      console.log("Página salva com sucesso usando cliente normal")
      return { success: true, message: "Página salva com sucesso" }
    }

    console.log("Página salva com sucesso usando cliente admin")
    return { success: true, message: "Página salva com sucesso" }
  } else {
    // Se não temos cliente admin, usar o cliente normal
    console.log("Usando cliente normal para salvar página")
    const { error } = await supabase.from("pages").insert([dataToInsert])

    if (error) {
      console.error("Erro ao salvar página no Supabase:", error)
      throw error
    }

    console.log("Página salva com sucesso")
    return { success: true, message: "Página salva com sucesso" }
  }
}

// Função para buscar uma página pelo page_id
export async function getPageById(pageId: string) {
  console.log(`=== INICIANDO BUSCA DE PÁGINA NO SUPABASE ===`)
  console.log(`ID da página: "${pageId}"`)

  try {
    // Tentar primeiro com o cliente admin (se disponível)
    if (supabaseAdmin !== supabase) {
      console.log("Usando cliente admin para buscar página")
      const { data, error } = await supabaseAdmin.from("pages").select("*").eq("page_id", pageId).single()

      if (error) {
        console.error("Erro com cliente admin:", error)
        console.log("Tentando com cliente normal...")

        // Se falhar com admin, tentar com cliente normal
        const { data: normalData, error: normalError } = await supabase
          .from("pages")
          .select("*")
          .eq("page_id", pageId)
          .single()

        if (normalError) {
          console.error("Erro com cliente normal:", normalError)
          return null
        }

        return normalData
      }

      return data
    } else {
      // Se não temos cliente admin, usar o cliente normal
      console.log("Usando cliente normal para buscar página")
      const { data, error } = await supabase.from("pages").select("*").eq("page_id", pageId).single()

      if (error) {
        console.error("Erro ao buscar página no Supabase:", error)
        return null
      }

      return data
    }
  } catch (error) {
    console.error("Exceção ao buscar página:", error)
    return null
  }
}

// Outras funções mantidas para compatibilidade, mas simplificadas
export async function updatePaymentStatus(pageId: string, status: string) {
  try {
    const { error } = await supabase
      .from("pages")
      .update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq("page_id", pageId)

    if (error) {
      console.error("Erro ao atualizar status de pagamento:", error)
      return { success: false, error: error.message }
    }

    return { success: true, message: "Status atualizado com sucesso" }
  } catch (error) {
    console.error("Exceção ao atualizar status:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

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
    console.error("Exceção ao listar páginas:", error)
    return null
  }
}

export async function getPagesByEmail(email: string, limit = 5) {
  try {
    const normalizedEmail = email.trim().toLowerCase()
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Erro ao buscar páginas por e-mail:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Exceção ao buscar páginas por e-mail:", error)
    return null
  }
}

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
    console.error("Exceção ao criar página de teste:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
