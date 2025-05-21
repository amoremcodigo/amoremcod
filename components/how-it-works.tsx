import { Heart, QrCode, ImageIcon, Clock } from "lucide-react"

export function HowItWorks() {
  return (
    <section className="w-full py-16 md:py-20" id="como-funciona">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Crie em <span className="gradient-text">4 etapas!</span>
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">É rapidinho, leva menos de 1 minuto!</p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-10">
          {[
            {
              icon: <Heart className="h-10 w-10 text-pink-500" />,
              title: "Preencha os dados",
            },
            {
              icon: <ImageIcon className="h-10 w-10 text-blue-500" />,
              title: "Adicione fotos",
            },
            {
              icon: <Clock className="h-10 w-10 text-green-500" />,
              title: "Escolha um plano",
            },
            {
              icon: <QrCode className="h-10 w-10 text-purple-500" />,
              title: "Receba o QR Code",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 rounded-lg border border-gray-800 p-6 bg-black/50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900">{item.icon}</div>
              <h3 className="text-xl font-bold">{item.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
