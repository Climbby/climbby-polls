import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={['poll-block p-5 sm:p-6', className].join(' ')}>
      {children}
    </div>
  )
}
