import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Laptop } from "lucide-react"

export function MySitesButton() {
  return (
    <section className="w-full py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">Já criou uma página com a gente?</h2>
            <p className="text-gray-400 md:text-lg">
              Acesse todas as suas páginas criadas anteriormente com seu e-mail.
            </p>
          </div>
          <Link href="/meus-sites">
            <Button size="lg" className="mt-4 gradient-bg">
              <Laptop className="mr-2 h-5 w-5" />
              Meus Sites
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
