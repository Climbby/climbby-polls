export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
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
