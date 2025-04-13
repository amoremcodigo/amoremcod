import { Heart, QrCode } from "lucide-react"

interface QrHeartIconProps {
  qrSize?: number
  heartSize?: number
  qrColor?: string
  heartColor?: string
  className?: string
}

export function QrHeartIcon({
  qrSize = 32,
  heartSize = 16,
  qrColor = "currentColor",
  heartColor = "#ec4899", // pink-500
  className = "",
}: QrHeartIconProps) {
  return (
    <div className={`relative inline-flex ${className}`}>
      <QrCode className={`h-${qrSize} w-${qrSize}`} color={qrColor} />
      <Heart
        className={`absolute -bottom-1 -right-1 h-${heartSize} w-${heartSize}`}
        color={heartColor}
        fill={heartColor}
      />
    </div>
  )
}
