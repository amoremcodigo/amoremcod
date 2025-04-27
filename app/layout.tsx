import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { FormProvider } from "@/context/form-context"
// Adicionar a importação do componente FacebookPixel
import FacebookPixel from "@/components/facebook-pixel"
// Adicionar a importação do Analytics no topo do arquivo
import { Analytics } from "@vercel/analytics/react"
// Adicionar a importação do componente GoogleTagManager no topo do arquivo
import GoogleTagManager from "@/components/google-tag-manager"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Amor em Código | Presentes digitais personalizados",
  description:
    "Crie páginas personalizadas para presentear pessoas especiais com mensagens, fotos e lembranças únicas.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
    generator: 'v0.dev'
}

// Dentro da função RootLayout, adicionar o componente FacebookPixel antes do fechamento da tag body
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-black">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:;"
        />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="SAMEORIGIN" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="theme-color" content="#000000" />
        <style>
          {`
          @media (max-width: 768px) {
            input, textarea, select {
              font-size: 16px !important; /* Previne zoom em iOS */
            }
          }
          `}
        </style>
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Suspense>
            <FormProvider>{children}</FormProvider>
          </Suspense>
        </ThemeProvider>
        <GoogleTagManager gtmId="GTM-W4MJ8DVF" />
        <FacebookPixel />
        <Analytics />
      </body>
    </html>
  )
}
