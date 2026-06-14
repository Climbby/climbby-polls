import { useTheme } from '../lib/useTheme'
import { IconButton, MoonIcon, SunIcon } from './ui/IconButton'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'light' ? 'Dark mode' : 'Light mode'

  return (
    <IconButton
      label={label}
      onClick={toggleTheme}
      className="text-ink-muted hover:bg-transparent hover:text-ink"
    >
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  )
}
