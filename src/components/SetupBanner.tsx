import { isSupabaseConfigured } from '../lib/supabase'

export function SetupBanner() {
  if (isSupabaseConfigured) return null

  return (
    <div className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-secondary">
      Add Supabase keys to <code className="text-ink">.env</code> to load polls.
    </div>
  )
}
