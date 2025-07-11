import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SurvivorMx - Liga MX Survivor 2025-2026",
  description:
    "Competencia de supervivencia de Liga MX. Elige un equipo cada jornada sin repetir. ¡Sobrevive hasta el final!",
  keywords: "Liga MX, Survivor, Fútbol, Competencia, México, Deportes, Juego",
  authors: [{ name: "SurvivorMx Team" }],
  creator: "SurvivorMx",
  publisher: "SurvivorMx",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://survivormx.vercel.app",
    title: "SurvivorMx - Liga MX Survivor 2025-2026",
    description: "Competencia de supervivencia de Liga MX. ¡Únete y demuestra tu conocimiento del fútbol mexicano!",
    siteName: "SurvivorMx",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SurvivorMx - Liga MX Survivor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SurvivorMx - Liga MX Survivor 2025-2026",
    description: "Competencia de supervivencia de Liga MX. ¡Únete y demuestra tu conocimiento del fútbol mexicano!",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#16a34a",
      },
    ],
  },
  verification: {
    google: "your-google-verification-code",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#16a34a" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="application-name" content="SurvivorMx" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SurvivorMx" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#16a34a" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <noscript>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div>
              <h1 style={{ color: "#16a34a", marginBottom: "16px" }}>🏆 SurvivorMx</h1>
              <p style={{ color: "#374151" }}>
                Esta aplicación requiere JavaScript para funcionar correctamente.
                <br />
                Por favor, habilita JavaScript en tu navegador.
              </p>
            </div>
          </div>
        </noscript>
        {children}
      </body>
    </html>
  )
}
