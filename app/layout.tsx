import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { FormProvider } from "@/context/form-context"
// Import the FacebookPixel component at the top of the file
import FacebookPixel from "@/components/facebook-pixel"

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

// Add the FacebookPixel component inside the body tag, right before the closing tag
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
          content="default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:; connect-src 'self' https://connect.facebook.net https://www.facebook.com;"
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
          <FormProvider>{children}</FormProvider>
        </ThemeProvider>
        <FacebookPixel />
      </body>
    </html>
  )
}


import './globals.css'