import Image from "next/image"

export function Testimonials() {
  return (
    <section className="w-full py-16 md:py-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              O que nossos <span className="gradient-text">clientes</span> dizem
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
              Veja como nossa plataforma tem ajudado pessoas a expressar seus sentimentos de forma única.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-10">
          {[
            {
              name: "Mariana & Paulo",
              text: "Meu namorado amou a surpresa! O QR Code no cartão de aniversário levando para nossa página personalizada foi uma ideia incrível.",
              image:
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-08%20at%202.46.15%20AM-U8k7zpVoboYvvADcFTfKwtivdIY5qY.jpeg",
            },
            {
              name: "Carlos & Família",
              text: "Criei uma página para o aniversário dos meus pais. O contador mostrando quanto tempo eles estão juntos foi muito especial para toda a família.",
              image: "/solitary-contemplation.png",
            },
            {
              name: "Fernanda & Rex",
              text: "Fiz uma homenagem para meu cachorro! A possibilidade de adicionar nossa música favorita do YouTube tornou a experiência ainda mais divertida.",
              image: "/woman-and-dog-park.png",
            },
            {
              name: "Guilherme & Raieli",
              text: "Fiz uma surpresa para o nosso aniversário de 5 anos. Ela chorou ao ver todas as nossas fotos e mensagens especiais.",
              image:
                "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-04-08%20at%202.41.00%20AM-Mc7oBM3VUk2jKDAfIhM8tnTuQOIPrk.jpeg",
            },
            {
              name: "Grupo de Amigos",
              text: "Criamos uma página para nossa amizade de 10 anos. Interface super fácil de usar e o resultado ficou incrível!",
              image: "/man-portrait-4.png",
            },
            {
              name: "Pedro & Vovó Luiza",
              text: "Recomendo o plano premium! Fiz para minha avó de 90 anos e ela se emocionou com as fotos antigas que colocamos.",
              image: "/man-portrait-3.png",
            },
          ].map((testimonial, index) => (
            <div key={index} className="flex flex-col space-y-2 rounded-lg border border-gray-800 p-6 bg-black/50">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-300">{testimonial.text}</p>
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
