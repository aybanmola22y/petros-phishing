import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Password Reset - Company Portal",
  description: "Reset your company account password",
  icons: {
    icon: "/favicon.png",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
