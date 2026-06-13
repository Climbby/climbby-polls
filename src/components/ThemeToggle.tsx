import { useTheme } from '../lib/useTheme'
import { IconButton, MoonIcon, SunIcon } from './ui/IconButton'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'light' ? 'Dark mode' : 'Light mode'

  return (
    <IconButton
      label={label}
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-20 bg-surface ring-1 ring-line"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  )
}
