import type React from "react"
import "./globals.css"
import Navigation from "@/components/navigation"

export const metadata = {
  title: "John Doe - Developer & Creative",
  description: "Personal website showcasing my work and experience",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="main-content">{children}</main>
      </body>
    </html>
  )
}
