'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'
interface Ctx { theme: Theme; toggle(): void }
const ThemeContext = createContext<Ctx>({ theme: 'dark', toggle(){} })

export function ThemeProvider ({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  // initial – respect localStorage if it exists
  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) ?? 'dark'
    setTheme(stored)
  }, [])

  // reflect in DOM + storage
  useEffect(() => {
    const html = document.documentElement         // ★
    html.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
