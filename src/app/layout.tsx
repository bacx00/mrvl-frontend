import './globals.css'
import type { ReactNode } from 'react'
import { AuthProvider }  from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import Header  from '@/components/Header'
import Footer  from '@/components/Footer'

export const metadata = {
  title       : 'Marvel Rivals',
  description : 'Esports stats, news & forums',
}

export default function RootLayout ({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
