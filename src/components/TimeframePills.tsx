import { useEffect, useRef, useState } from 'react'
import { TIMEFRAME_LABELS, type ResultTimeframe } from '../lib/poll-results'

const TIMEFRAMES: ResultTimeframe[] = ['7d', '30d', 'alltime']

const menuWidthClass = 'w-[5.25rem] md:w-[6.5rem]'
const slotHeightClass = 'h-9 md:h-10'
const rowClass = [
  'flex w-full cursor-pointer items-center justify-between bg-surface px-2 text-xs font-medium leading-none outline-none transition-interactive',
  'hover:bg-surface-muted hover:text-ink',
  slotHeightClass,
  'md:px-2.5 md:text-sm',
].join(' ')

interface TimeframePillsProps {
  value: ResultTimeframe
  onChange: (value: ResultTimeframe) => void
}

export function TimeframePills({ value, onChange }: TimeframePillsProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function selectTimeframe(next: ResultTimeframe) {
    onChange(next)
    setOpen(false)
  }

  const otherTimeframes = TIMEFRAMES.filter((timeframe) => timeframe !== value)

  return (
    <div ref={rootRef} className={['relative shrink-0', menuWidthClass, slotHeightClass].join(' ')}>
      <div
        className={[
          'overflow-hidden rounded-md border border-line bg-surface md:rounded-lg',
          menuWidthClass,
          open ? 'absolute right-0 top-0 z-20' : 'h-full',
        ].join(' ')}
      >
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Timeframe: ${TIMEFRAME_LABELS[value]}`}
          onClick={() => setOpen((current) => !current)}
          className={[rowClass, 'text-ink-secondary'].join(' ')}
        >
          <span className="truncate">{TIMEFRAME_LABELS[value]}</span>
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div role="listbox" aria-label="Select timeframe">
            {otherTimeframes.map((timeframe) => (
              <button
                key={timeframe}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => selectTimeframe(timeframe)}
                className={[rowClass, 'border-t border-line text-ink-secondary'].join(' ')}
              >
                <span className="truncate">{TIMEFRAME_LABELS[timeframe]}</span>
                <span className="w-3 shrink-0 md:w-3.5" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={['shrink-0 text-ink-muted transition-smooth md:h-3.5 md:w-3.5', open ? 'rotate-180' : ''].join(' ')}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
