import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Faltam variáveis de ambiente do Supabase")
}

// Criar o cliente do Supabase
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Criar um cliente com a chave de serviço para operações administrativas
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : supabase

// Função para salvar uma página no Supabase com retry
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
}) {
  const maxRetries = 3
  let retryCount = 0
  let lastError = null

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de salvar página no Supabase. ID: ${pageData.page_id}`)

      // Usar o cliente admin para garantir permissões
      const { data, error } = await supabaseAdmin.from("pages").insert([pageData]).select()

      if (error) {
        console.error(`Erro na tentativa ${retryCount + 1} ao salvar página no Supabase:`, error)
        lastError = error
        retryCount++

        // Esperar antes de tentar novamente (backoff exponencial)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
        continue
      }

      console.log(`Página salva com sucesso no Supabase após ${retryCount + 1} tentativa(s). ID: ${pageData.page_id}`)

      // Verificar se a página foi realmente salva
      const verifyData = await getPageById(pageData.page_id)
      if (!verifyData) {
        console.warn(`Verificação falhou: Página ${pageData.page_id} não encontrada após salvamento`)
      } else {
        console.log(`Verificação bem-sucedida: Página ${pageData.page_id} encontrada após salvamento`)
      }

      return data
    } catch (error) {
      console.error(`Exceção na tentativa ${retryCount + 1} ao salvar página:`, error)
      lastError = error
      retryCount++

      // Esperar antes de tentar novamente
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
    }
  }

  console.error(`Falha após ${maxRetries} tentativas de salvar página:`, lastError)
  throw lastError
}

// Função para buscar uma página pelo page_id com retry
export async function getPageById(pageId: string) {
  const maxRetries = 3
  let retryCount = 0
  let lastError = null

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de buscar página com ID: "${pageId}"`)

      // Usar o cliente admin para garantir permissões
      const { data, error } = await supabaseAdmin.from("pages").select("*").eq("page_id", pageId).single()

      if (error) {
        console.error(`Erro na tentativa ${retryCount + 1} ao buscar página no Supabase:`, error)
        lastError = error
        retryCount++

        // Esperar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
        continue
      }

      if (!data) {
        console.log(`Página com ID "${pageId}" não encontrada na tentativa ${retryCount + 1}`)
      } else {
        console.log(`Página com ID "${pageId}" encontrada na tentativa ${retryCount + 1}`)
      }

      return data
    } catch (error) {
      console.error(`Exceção na tentativa ${retryCount + 1} ao buscar página:`, error)
      lastError = error
      retryCount++

      // Esperar antes de tentar novamente
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

  while (retryCount < maxRetries) {
    try {
      console.log(`Tentativa ${retryCount + 1} de atualizar status de pagamento para página "${pageId}": "${status}"`)

      // Usar o cliente admin para garantir permissões
      const { data, error } = await supabaseAdmin
        .from("pages")
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq("page_id", pageId)
        .select()

      if (error) {
        console.error(`Erro na tentativa ${retryCount + 1} ao atualizar status de pagamento:`, error)
        lastError = error
        retryCount++

        // Esperar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
        continue
      }

      console.log(
        `Status de pagamento atualizado com sucesso após ${retryCount + 1} tentativa(s). ID: ${pageId}, Status: ${status}`,
      )

      // Verificar se o status foi realmente atualizado
      const verifyData = await getPageById(pageId)
      if (!verifyData) {
        console.warn(`Verificação falhou: Página ${pageId} não encontrada após atualização de status`)
      } else if (verifyData.payment_status !== status) {
        console.warn(
          `Verificação falhou: Status não foi atualizado corretamente. Esperado: ${status}, Atual: ${verifyData.payment_status}`,
        )
      } else {
        console.log(`Verificação bem-sucedida: Status atualizado corretamente para ${status}`)
      }

      return data
    } catch (error) {
      console.error(`Exceção na tentativa ${retryCount + 1} ao atualizar status:`, error)
      lastError = error
      retryCount++

      // Esperar antes de tentar novamente
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

    const { data, error } = await supabaseAdmin
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
  } catch (error) {
    console.error("Exceção ao listar páginas:", error)
    return null
  }
}

// Função para forçar a criação de uma página de teste
export async function createTestPage() {
  const testId = `test-${Math.random().toString(36).substring(2, 8)}`

  try {
    const pageData = {
      page_id: testId,
      email: "teste@exemplo.com",
      couple_names: "Teste & Teste",
      date: new Date().toISOString().split("T")[0],
      time: "12:00:00",
      message: "Esta é uma página de teste para verificar a conexão com o Supabase",
      youtube_link: "",
      photo_urls: ["https://picsum.photos/200/300"],
      plan: "basic",
      page_url: `https://amoremcodigo.com.br/pagina/${testId}`,
      qr_code_url: "",
      payment_status: "pending",
    }

    const result = await savePage(pageData)
    console.log("Página de teste criada com sucesso:", testId)
    return { success: true, pageId: testId, result }
  } catch (error) {
    console.error("Erro ao criar página de teste:", error)
    return { success: false, error }
  }
}
