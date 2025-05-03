import { createClient } from "@/lib/supabase"

/**
 * Módulo para lidar com operações relacionadas a páginas
 */

/**
 * Salva os dados de uma página no Supabase
 * @param pageData Dados da página a serem salvos
 * @returns Objeto com o resultado da operação (success: boolean, message: string, data?: any, error?: any)
 */
export async function savePage(pageData: any) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("pages").insert([pageData]).select()

    if (error) {
      console.error("Erro ao salvar página:", error)
      return { success: false, message: "Erro ao salvar página", error: error.message }
    }

    return { success: true, message: "Página salva com sucesso", data }
  } catch (error) {
    console.error("Exceção ao salvar página:", error)
    return {
      success: false,
      message: "Exceção ao salvar página",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Lista as páginas mais recentes do sistema
 * @param limit Número máximo de páginas a serem retornadas
 * @returns Array com as páginas encontradas ou null em caso de erro
 */
export async function listRecentPages(limit = 1) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("ERRO AO LISTAR PÁGINAS RECENTES:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("ERRO AO LISTAR PÁGINAS RECENTES:", error)
    return null
  }
}
