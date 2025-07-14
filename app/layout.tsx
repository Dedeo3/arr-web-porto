import type React from "react"
import "./globals.css"
import Navigation from "@/components/navigation"

export const metadata = {
  title: "Arr - Mobile and Back-end Developer",
  description: "Personal website showcasing my work and experience",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
         <link rel="icon" href="/profile.png" type="image/png"/>
      </head>
      <body>
        <Navigation />
        <main className="main-content">{children}</main>
      </body>
    </html>
  )
}
