import { AuthProvider } from '@/hooks/useAuth'
import Nav             from '@/components/Nav'
import './global.css'

export const metadata = {
  title:       'Gitto',
  description: 'Track your journey. Share your progress.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#0d0d0f] text-[#f0f0f2] min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <Nav />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}