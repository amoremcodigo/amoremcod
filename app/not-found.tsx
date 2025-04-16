export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">404</span> -
          Página não encontrada
        </h1>
        <p className="text-xl text-gray-400 mb-8">Ops! A página que você está procurando não existe ou foi removida.</p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-purple-700 to-pink-500 px-8 py-3 text-lg font-medium text-white shadow-lg hover:opacity-90 transition-opacity"
        >
          Voltar para a página inicial
        </a>
      </div>
    </div>
  )
}
