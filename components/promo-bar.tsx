import { Gift } from "lucide-react"

export function PromoBar() {
  return (
    <div className="relative w-full">
      {/* Efeito de onda infinita na parte superior */}
      <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
        <div className="wave-animation"></div>
      </div>

      <div className="w-full py-2 px-4 text-center text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-4 w-4" />
          <p>Planos com até 50% OFF | Crie sua página agora!</p>
        </div>
      </div>
    </div>
  )
}
