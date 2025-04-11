import { createClient } from "@supabase/supabase-js"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Faltam variáveis de ambiente do Supabase")
}

// Criar o cliente do Supabase
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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
}) {
  try {
    const { data, error } = await supabase.from("pages").insert([pageData]).select()

    if (error) {
      console.error("Erro ao salvar página no Supabase:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao salvar página:", error)
    throw error
  }
}

// Função para buscar uma página pelo page_id
export async function getPageById(pageId: string) {
  try {
    console.log(`Buscando página com ID: "${pageId}"`)

    const { data, error } = await supabase.from("pages").select("*").eq("page_id", pageId).single()

    if (error) {
      console.error("Erro ao buscar página no Supabase:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Erro ao buscar página:", error)
    return null
  }
}

// Função para atualizar o status de pagamento de uma página
export async function updatePaymentStatus(pageId: string, status: string) {
  try {
    console.log(`Atualizando status de pagamento para página "${pageId}": "${status}"`)

    const { data, error } = await supabase
      .from("pages")
      .update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq("page_id", pageId)
      .select()

    if (error) {
      console.error("Erro ao atualizar status de pagamento:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Erro ao atualizar status:", error)
    throw error
  }
}
