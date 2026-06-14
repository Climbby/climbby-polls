import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className = '', id, disabled, ...props },
  ref,
) {
  const inputId = id ?? (typeof label === 'string' ? `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

  return (
    <label
      htmlFor={inputId}
      className={[
        'group inline-flex cursor-pointer select-none items-center gap-2.5',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        className,
      ].join(' ')}
    >
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={[
            'transition-interactive absolute inset-0 rounded-[4px] border border-line bg-surface',
            'peer-hover:border-[color-mix(in_srgb,var(--ink)_18%,var(--line))] peer-hover:bg-surface-muted',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
            'peer-focus-visible:outline-[color-mix(in_srgb,var(--poll-fill)_45%,transparent)]',
            'peer-checked:border-[color-mix(in_srgb,var(--poll-fill-strong)_55%,var(--line))]',
            'peer-checked:bg-[color-mix(in_srgb,var(--poll-fill)_28%,var(--surface-muted))]',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          ].join(' ')}
        />
        <CheckIcon className="pointer-events-none relative z-[1] h-3 w-3 scale-75 text-ink opacity-0 transition-smooth peer-checked:scale-100 peer-checked:opacity-100" />
      </span>
      {label && (
        <span className="text-xs text-ink-secondary transition-interactive group-hover:text-ink md:text-sm">
          {label}
        </span>
      )}
    </label>
  )
})

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12.5 10 17.5 19 7.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
