'use client'
// frontend/src/components/Nav.jsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Avatar from './Avatar'

export default function Nav() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  // Don't show nav on auth pages
  if (pathname === '/login' || pathname === '/signup') return null

  return (
    <nav className="nav">
      <Link href="/feed" className="nav-logo">Gitt<span>o</span></Link>

      <div className="nav-links">
        {[
          ['/feed',   '🏠 Feed'],
          ['/search', '🔍 Search'],
        ].map(([href, label]) => (
          <Link key={href} href={href} className={`nav-link ${pathname === href ? 'active' : ''}`}>
            {label}
          </Link>
        ))}
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <Link href="/project/new" className="btn btn-primary btn-sm">+ New Project</Link>
            <Link href={`/profile/${user.handle}`}>
              <div className="avatar-sm">
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : getInitials(user.name)
                }
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link href="/login"  className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}

function getInitials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}