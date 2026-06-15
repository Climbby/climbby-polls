export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  return `${years}y ago`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatPollStarted(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso))
}

export function formatPollTimeframe(poll: {
  status: string
  created_at: string
  closes_at: string | null
  closed_at: string | null
}): string {
  if (poll.status === 'closed' && poll.closed_at) {
    return `Closed · ${formatDateTime(poll.closed_at)}`
  }
  if (poll.closes_at) {
    const closes = new Date(poll.closes_at)
    if (closes.getTime() < Date.now()) {
      return `Ended · ${formatDateTime(poll.closes_at)}`
    }
    return `Open until · ${formatDateTime(poll.closes_at)}`
  }
  return `Started · ${formatDateTime(poll.created_at)}`
}
