import { isSupabaseConfigured } from '../lib/supabase'

export function SetupBanner() {
  if (isSupabaseConfigured) return null

  return (
    <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <strong>Setup needed:</strong> copy <code className="rounded bg-slate-900 px-1.5 py-0.5 text-amber-100">.env.example</code>{' '}
      to <code className="rounded bg-slate-900 px-1.5 py-0.5 text-amber-100">.env</code> and add your Supabase URL + anon key.
      Run the SQL migration in <code className="rounded bg-slate-900 px-1.5 py-0.5 text-amber-100">supabase/migrations/</code>.
    </div>
  )
}
