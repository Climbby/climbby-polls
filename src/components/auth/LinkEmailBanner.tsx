import { Card } from '../ui/Card'
import { EmailSignInForm } from './EmailSignInForm'

interface LinkEmailBannerProps {
  redirectPath: string
}

export function LinkEmailBanner({ redirectPath }: LinkEmailBannerProps) {
  return (
    <Card className="mb-6 !border-accent/30 !bg-surface-muted/40">
      <h2 className="text-sm font-semibold text-ink">Save access to this page</h2>
      <p className="mt-1 text-sm text-ink-secondary">
        Link your email so you can manage polls from any device.
      </p>
      <EmailSignInForm
        mode="link"
        redirectPath={redirectPath}
        className="mt-4"
        sentMessage="Check your inbox to confirm your email. After that, use the same address to sign in elsewhere."
      />
    </Card>
  )
}
