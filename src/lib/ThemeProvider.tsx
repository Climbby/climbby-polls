import { useEffect, useState, type ReactNode } from 'react'
import { getInitialTheme, STORAGE_KEY, ThemeContext, type Theme } from './theme-context'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialTheme()
    applyTheme(initial)
    return initial
  })

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => {
      const next: Theme = current === 'light' ? 'dark' : 'light'
      const root = document.documentElement
      root.classList.add('theme-switching')
      applyTheme(next)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.classList.remove('theme-switching')
        })
      })
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  )
}
