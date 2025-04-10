import { getPageById } from "@/lib/supabase"
import { redirect } from "next/navigation"

// Esta função é executada no servidor
export async function generateMetadata({ params }: { params: { id: string } }) {
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

export default async function PaginaDetalhes({ params }: { params: { id: string } }) {
  const pageId = params.id

  // Buscar dados da página no Supabase
  const pageData = await getPageById(pageId)

  // Se a página não existir, redirecionar para a página inicial
  if (!pageData) {
    redirect("/")
  }

  // Renderizar a página com os dados do Supabase
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center gradient-text">{pageData.couple_names}</h1>

        <div className="mb-4 text-center">
          <p className="text-gray-400">Página encontrada no Supabase!</p>
          <p className="text-gray-400">ID: {pageId}</p>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-primary">Dados da Página:</h2>
            <pre className="mt-2 rounded-md bg-gray-800 p-4 overflow-auto text-xs text-gray-300">
              {JSON.stringify(pageData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
