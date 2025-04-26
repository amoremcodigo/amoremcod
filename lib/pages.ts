import { createClient } from "@/lib/supabase"

/**
 * Módulo para lidar com operações relacionadas a páginas
 */

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
