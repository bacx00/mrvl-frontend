'use client'
import Link   from 'next/link'
import Image  from 'next/image'
import { useContext } from 'react'
import { AuthContext }  from '@/context/AuthContext'
import { useTheme }     from '@/context/ThemeContext'

const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) =>
  <Link href={href} className="px-3 py-2 hover:text-accent">{children}</Link>

export default function Header () {
  const { user, logout } = useContext(AuthContext)
  const { theme, toggle } = useTheme()

  const logo = theme === 'dark' ? '/white.svg' : '/dark.svg'

  return (
    <header className="sticky top-0 z-50 border-b border-accent/40 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        {/* brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image src={logo} alt="Logo" width={32} height={32} priority />
          Marvel Rivals
        </Link>

        {/* nav */}
        <nav className="hidden md:flex items-center text-sm">
          <NavLink href="/forums">Forums</NavLink>
          <NavLink href="/matches">Matches</NavLink>
          <NavLink href="/events">Events</NavLink>
          <NavLink href="/rankings">Rankings</NavLink>
          <NavLink href="/stats">Stats</NavLink>
        </nav>

        {/* right controls */}
        <div className="flex items-center gap-3">
          {/* theme toggle */}
          <button
            onClick={toggle}
            className="rounded p-1 hover:bg-accent/20"
            aria-label="toggle theme"
          >
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>

          {user ? (
            <>
              {['admin','editor','writer'].includes(user.role) &&
                <Link href={`/${user.role}`} className="text-sm hover:text-accent capitalize">{user.role}</Link>}
              <button onClick={logout} className="text-sm hover:text-accent">Logout</button>
            </>
          ) : (
            <>
              <Link href="/user/login"    className="text-sm hover:text-accent">Log in</Link>
              <Link href="/user/register" className="text-sm hover:text-accent">Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
