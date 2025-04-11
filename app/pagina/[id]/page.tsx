import { getPageById } from "@/lib/supabase"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import PaginaDetalhesClient from "./page.client"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const pageId = params.id

  // Buscar dados da página no Supabase
  const pageData = await getPageById(pageId)

  if (!pageData) {
    return {
      title: "Página não encontrada | Amor em Código",
      description: "A página que você está procurando não existe ou foi removida.",
    }
  }

  return {
    title: `${pageData.couple_names} | Amor em Código`,
    description: `Página personalizada para ${pageData.couple_names}. Criada com Amor em Código.`,
  }
}

export default async function PaginaDetalhes({
  params,
  searchParams,
}: { params: { id: string }; searchParams: { d?: string } }) {
  const pageId = params.id

  // Buscar dados da página no Supabase
  const pageData = await getPageById(pageId)

  // Se a página não existir, redirecionar para a página inicial
  if (!pageData) {
    redirect("/")
  }

  return <PaginaDetalhesClient pageId={pageId} pageData={pageData} searchParams={searchParams} />
}
