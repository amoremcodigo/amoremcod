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
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")

// Criar um cliente com a chave de serviço para operações administrativas
export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl || "", supabaseServiceKey) : supabase

// Modificar a função savePage para garantir que os dados sejam salvos corretamente no Supabase
// Remover qualquer referência a armazenamento local

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
  let retryCount = 0
  let lastError = null

  // Adicionar timestamps se não existirem
  const dataWithTimestamps = {
    ...pageData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    payment_status: pageData.payment_status || "pending",
  }

  console.log("=== INICIANDO SALVAMENTO DE PÁGINA NO SUPABASE ===")
  console.log("ID da página:", pageData.page_id)
  console.log("Email:", pageData.email)
  console.log("Nome do casal:", pageData.couple_names)
  console.log("Plano:", pageData.plan)
  console.log("URLs das fotos:", pageData.photo_urls.length)
  console.log("Supabase URL:", supabaseUrl ? "Configurado" : "NÃO CONFIGURADO")
  console.log("Supabase Anon Key:", supabaseAnonKey ? "Configurado" : "NÃO CONFIGURADO")

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Credenciais do Supabase não configuradas. Impossível salvar dados.")
  }

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de salvar página no Supabase. ID: ${pageData.page_id}`)

      // Tentar primeiro com o cliente admin (se disponível)
      if (supabaseServiceKey && supabaseAdmin !== supabase) {
        console.log("Usando cliente admin para salvar página")
        const { data, error } = await supabaseAdmin.from("pages").insert([dataWithTimestamps]).select()

        if (error) {
          console.error(`Erro com cliente admin na tentativa ${retryCount + 1}:`, error)
          console.log("Tentando com cliente normal...")

          // Se falhar com admin, tentar com cliente normal
          const normalResult = await supabase.from("pages").insert([dataWithTimestamps]).select()

          if (normalResult.error) {
            console.error(`Erro com cliente normal na tentativa ${retryCount + 1}:`, normalResult.error)
            lastError = normalResult.error
            retryCount++
            // Aumentar o tempo de espera entre tentativas
            await new Promise((resolve) => setTimeout(resolve, 2000 * Math.pow(2, retryCount)))
            continue
          }

          console.log(`Página salva com sucesso usando cliente normal após ${retryCount + 1} tentativa(s)`)
          return normalResult.data
        }

        console.log(`Página salva com sucesso usando cliente admin após ${retryCount + 1} tentativa(s)`)
        return data
      } else {
        // Se não temos cliente admin, usar o cliente normal
        console.log("Usando cliente normal para salvar página")
        const { data, error } = await supabase.from("pages").insert([dataWithTimestamps]).select()

        if (error) {
          console.error(`Erro na tentativa ${retryCount + 1} ao salvar página no Supabase:`, error)
          lastError = error
          retryCount++
          // Aumentar o tempo de espera entre tentativas
          await new Promise((resolve) => setTimeout(resolve, 2000 * Math.pow(2, retryCount)))
          continue
        }

        console.log(`Página salva com sucesso após ${retryCount + 1} tentativa(s). ID: ${pageData.page_id}`)
        return data
      }
    } catch (error) {
      console.error(`Exceção na tentativa ${retryCount + 1} ao salvar página:`, error)
      lastError = error
      retryCount++
      // Aumentar o tempo de espera entre tentativas
      await new Promise((resolve) => setTimeout(resolve, 2000 * Math.pow(2, retryCount)))
    }
  }

  console.error(`FALHA CRÍTICA: Não foi possível salvar a página após ${maxRetries} tentativas:`, lastError)
  throw new Error(
    `Falha ao salvar no Supabase após ${maxRetries} tentativas: ${lastError ? JSON.stringify(lastError) : "Erro desconhecido"}`,
  )
}

// Função para buscar uma página pelo page_id com retry
export async function getPageById(pageId: string) {
  const maxRetries = 3
  let retryCount = 0
  let lastError = null

  console.log(`=== INICIANDO BUSCA DE PÁGINA NO SUPABASE ===`)
  console.log(`ID da página: "${pageId}"`)

  // Verificar primeiro no localStorage como fallback
  try {
    if (typeof localStorage !== "undefined") {
      const localData = localStorage.getItem(`page_${pageId}`)
      if (localData) {
        console.log("Página encontrada no armazenamento local")
        return JSON.parse(localData)
      }
    }
  } catch (localError) {
    console.error("Erro ao buscar do armazenamento local:", localError)
  }

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de buscar página com ID: "${pageId}"`)

      // Tentar primeiro com o cliente admin (se disponível)
      if (supabaseAdmin !== supabase) {
        console.log("Usando cliente admin para buscar página")
        const { data, error } = await supabaseAdmin.from("pages").select("*").eq("page_id", pageId).single()

        if (error) {
          console.error(`Erro com cliente admin na tentativa ${retryCount + 1}:`, error)
          console.log("Tentando com cliente normal...")

          // Se falhar com admin, tentar com cliente normal
          const normalResult = await supabase.from("pages").select("*").eq("page_id", pageId).single()

          if (normalResult.error) {
            console.error(`Erro com cliente normal na tentativa ${retryCount + 1}:`, normalResult.error)
            lastError = normalResult.error
            retryCount++
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
            continue
          }

          if (!normalResult.data) {
            console.log(`Página com ID "${pageId}" não encontrada na tentativa ${retryCount + 1} (cliente normal)`)
          } else {
            console.log(`Página com ID "${pageId}" encontrada na tentativa ${retryCount + 1} (cliente normal)`)
          }

          return normalResult.data
        }

        if (!data) {
          console.log(`Página com ID "${pageId}" não encontrada na tentativa ${retryCount + 1} (cliente admin)`)
        } else {
          console.log(`Página com ID "${pageId}" encontrada na tentativa ${retryCount + 1} (cliente admin)`)
        }

        return data
      } else {
        // Se não temos cliente admin, usar o cliente normal
        console.log("Usando cliente normal para buscar página")
        const { data, error } = await supabase.from("pages").select("*").eq("page_id", pageId).single()

        if (error) {
          console.error(`Erro na tentativa ${retryCount + 1} ao buscar página no Supabase:`, error)
          lastError = error
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
          continue
        }

        if (!data) {
          console.log(`Página com ID "${pageId}" não encontrada na tentativa ${retryCount + 1}`)
        } else {
          console.log(`Página com ID "${pageId}" encontrada na tentativa ${retryCount + 1}`)
        }

        return data
      }
    } catch (error) {
      console.error(`Exceção na tentativa ${retryCount + 1} ao buscar página:`, error)
      lastError = error
      retryCount++
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
    }
  }

  console.error(`Falha após ${maxRetries} tentativas de buscar página:`, lastError)
  return null
}

// Função para atualizar o status de pagamento de uma página com retry
export async function updatePaymentStatus(pageId: string, status: string) {
  const maxRetries = 3
  let retryCount = 0
  let lastError = null

  console.log(`=== INICIANDO ATUALIZAÇÃO DE STATUS DE PAGAMENTO ===`)
  console.log(`ID da página: "${pageId}", Novo status: "${status}"`)

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de atualizar status de pagamento para página "${pageId}": "${status}"`)

      // Tentar primeiro com o cliente admin (se disponível)
      if (supabaseAdmin !== supabase) {
        console.log("Usando cliente admin para atualizar status")
        const { data, error } = await supabaseAdmin
          .from("pages")
          .update({ payment_status: status, updated_at: new Date().toISOString() })
          .eq("page_id", pageId)
          .select()

        if (error) {
          console.error(`Erro com cliente admin na tentativa ${retryCount + 1}:`, error)
          console.log("Tentando com cliente normal...")

          // Se falhar com admin, tentar com cliente normal
          const normalResult = await supabase
            .from("pages")
            .update({ payment_status: status, updated_at: new Date().toISOString() })
            .eq("page_id", pageId)
            .select()

          if (normalResult.error) {
            console.error(`Erro com cliente normal na tentativa ${retryCount + 1}:`, normalResult.error)
            lastError = normalResult.error
            retryCount++
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
            continue
          }

          console.log(`Status atualizado com sucesso usando cliente normal após ${retryCount + 1} tentativa(s)`)

          // Atualizar também no localStorage se existir
          try {
            if (typeof localStorage !== "undefined") {
              const localData = localStorage.getItem(`page_${pageId}`)
              if (localData) {
                const parsedData = JSON.parse(localData)
                parsedData.payment_status = status
                parsedData.updated_at = new Date().toISOString()
                localStorage.setItem(`page_${pageId}`, JSON.stringify(parsedData))
                console.log("Status atualizado no armazenamento local")
              }
            }
          } catch (localError) {
            console.error("Erro ao atualizar no armazenamento local:", localError)
          }

          return normalResult.data
        }

        console.log(`Status atualizado com sucesso usando cliente admin após ${retryCount + 1} tentativa(s)`)

        // Atualizar também no localStorage se existir
        try {
          if (typeof localStorage !== "undefined") {
            const localData = localStorage.getItem(`page_${pageId}`)
            if (localData) {
              const parsedData = JSON.parse(localData)
              parsedData.payment_status = status
              parsedData.updated_at = new Date().toISOString()
              localStorage.setItem(`page_${pageId}`, JSON.stringify(parsedData))
              console.log("Status atualizado no armazenamento local")
            }
          }
        } catch (localError) {
          console.error("Erro ao atualizar no armazenamento local:", localError)
        }

        return data
      } else {
        // Se não temos cliente admin, usar o cliente normal
        console.log("Usando cliente normal para atualizar status")
        const { data, error } = await supabase
          .from("pages")
          .update({ payment_status: status, updated_at: new Date().toISOString() })
          .eq("page_id", pageId)
          .select()

        if (error) {
          console.error(`Erro na tentativa ${retryCount + 1} ao atualizar status de pagamento:`, error)
          lastError = error
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
          continue
        }

        console.log(`Status de pagamento atualizado com sucesso após ${retryCount + 1} tentativa(s)`)

        // Atualizar também no localStorage se existir
        try {
          if (typeof localStorage !== "undefined") {
            const localData = localStorage.getItem(`page_${pageId}`)
            if (localData) {
              const parsedData = JSON.parse(localData)
              parsedData.payment_status = status
              parsedData.updated_at = new Date().toISOString()
              localStorage.setItem(`page_${pageId}`, JSON.stringify(parsedData))
              console.log("Status atualizado no armazenamento local")
            }
          }
        } catch (localError) {
          console.error("Erro ao atualizar no armazenamento local:", localError)
        }

        return data
      }
    } catch (error) {
      console.error(`Exceção na tentativa ${retryCount + 1} ao atualizar status:`, error)
      lastError = error
      retryCount++
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
    }
  }

  console.error(`Falha após ${maxRetries} tentativas de atualizar status:`, lastError)
  throw lastError
}

// Função para listar todas as páginas (útil para depuração)
export async function listAllPages(limit = 100) {
  try {
    console.log(`Listando até ${limit} páginas do Supabase`)

    // Tentar primeiro com o cliente admin (se disponível)
    if (supabaseAdmin !== supabase) {
      console.log("Usando cliente admin para listar páginas")
      const { data, error } = await supabaseAdmin
        .from("pages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Erro ao listar páginas com cliente admin:", error)
        console.log("Tentando com cliente normal...")

        // Se falhar com admin, tentar com cliente normal
        const normalResult = await supabase
          .from("pages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit)

        if (normalResult.error) {
          console.error("Erro ao listar páginas com cliente normal:", normalResult.error)
          return null
        }

        console.log(`${normalResult.data.length} páginas encontradas com cliente normal`)
        return normalResult.data
      }

      console.log(`${data.length} páginas encontradas com cliente admin`)
      return data
    } else {
      // Se não temos cliente admin, usar o cliente normal
      console.log("Usando cliente normal para listar páginas")
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Erro ao listar páginas:", error)
        return null
      }

      console.log(`${data.length} páginas encontradas`)
      return data
    }
  } catch (error) {
    console.error("Exceção ao listar páginas:", error)
    return null
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

    // Tentar inserir a página de teste
    const { data, error } = await supabase.from("pages").insert([testPage]).select()

    if (error) {
      console.error("Erro ao criar página de teste:", error)
      return { success: false, error: error.message }
    }

    console.log("Página de teste criada com sucesso")
    return { success: true, data: data }
  } catch (error) {
    console.error("Exceção ao criar página de teste:", error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Função para buscar páginas pelo e-mail do cliente
export async function getPagesByEmail(email: string, limit = 5) {
  try {
    console.log(`Buscando páginas para o e-mail: "${email}"`)

    // Normalizar o e-mail (trim e lowercase)
    const normalizedEmail = email.trim().toLowerCase()

    // Tentar primeiro com o cliente admin (se disponível)
    if (supabaseAdmin !== supabase) {
      console.log("Usando cliente admin para buscar páginas por e-mail")
      const { data, error } = await supabaseAdmin
        .from("pages")
        .select("*")
        .eq("email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Erro ao buscar páginas por e-mail com cliente admin:", error)
        console.log("Tentando com cliente normal...")

        // Se falhar com admin, tentar com cliente normal
        const normalResult = await supabase
          .from("pages")
          .select("*")
          .eq("email", normalizedEmail)
          .order("created_at", { ascending: false })
          .limit(limit)

        if (normalResult.error) {
          console.error("Erro ao buscar páginas por e-mail com cliente normal:", normalResult.error)
          return null
        }

        console.log(
          `${normalResult.data.length} páginas encontradas para o e-mail ${normalizedEmail} com cliente normal`,
        )
        return normalResult.data
      }

      console.log(`${data.length} páginas encontradas para o e-mail ${normalizedEmail} com cliente admin`)
      return data
    } else {
      // Se não temos cliente admin, usar o cliente normal
      console.log("Usando cliente normal para buscar páginas por e-mail")
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

      console.log(`${data.length} páginas encontradas para o e-mail ${normalizedEmail}`)
      return data
    }
  } catch (error) {
    console.error("Exceção ao buscar páginas por e-mail:", error)
    return null
  }
}
