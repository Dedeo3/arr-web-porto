import type React from "react"
import type { Metadata, Viewport } from "next"
import { Fredoka, Inter } from "next/font/google"
import "./globals.css"

const display = Fredoka({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] })
const body = Inter({ subsets: ["latin"], variable: "--font-body" })

export const metadata: Metadata = {
  title: "Dedeo's World — Yoannes De Deo Haryo Wibisono",
  description: "An interactive 3D portfolio island: explore the houses to meet Yoannes De Deo Haryo Wibisono, a Mobile and Backend Developer.",
  icons: { icon: "/profile.png" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1020",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
