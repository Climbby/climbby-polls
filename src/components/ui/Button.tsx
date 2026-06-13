import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:opacity-90',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
}

export function Button({
  children,
  variant = 'primary',
  fullWidth,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-45',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
