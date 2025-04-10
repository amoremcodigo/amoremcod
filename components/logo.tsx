import { Heart, QrCode } from "lucide-react"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative">
        <QrCode className="h-8 w-8 text-primary" />
        <Heart className="absolute -bottom-1 -right-1 h-4 w-4 text-pink-500" />
      </div>
      <span className="font-bold text-xl">
        Amor em <span className="gradient-text">Código</span>
      </span>
    </Link>
  )
}
