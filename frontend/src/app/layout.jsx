'use client'
import { AuthProvider } from '@/hooks/useAuth'
import { SessionProvider } from 'next-auth/react'
import Nav             from '@/components/Nav'
import './global.css'


export default function RootLayout({ children }) {
  return (   
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#0d0d0f] text-[#f0f0f2] min-h-screen" suppressHydrationWarning>
        <SessionProvider>
        <AuthProvider>
          <Nav />
          <main>{children}</main>
        </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  )
}