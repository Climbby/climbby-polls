const OTP_COOLDOWN_KEY = 'climbby-polls:otp-sent-at'
const OTP_COOLDOWN_MS = 60_000

function storageKey(email: string) {
  return `${OTP_COOLDOWN_KEY}:${email.trim().toLowerCase()}`
}

export function getOtpCooldownRemaining(email: string): number {
  const raw = sessionStorage.getItem(storageKey(email))
  if (!raw) return 0

  const sentAt = Number(raw)
  if (!Number.isFinite(sentAt)) return 0

  const remaining = OTP_COOLDOWN_MS - (Date.now() - sentAt)
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

export function markOtpSent(email: string) {
  sessionStorage.setItem(storageKey(email), String(Date.now()))
}

export function formatAuthError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return 'Too many sign-in emails were sent. Wait about an hour, or use the link from your last email if you already got one.'
  }

  if (normalized.includes('invalid email')) {
    return 'That email address looks invalid.'
  }

  return message
}
