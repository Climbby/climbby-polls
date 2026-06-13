import { useState } from 'react'
import { adminSecret } from '../lib/supabase'
import { isAdminUnlocked, lockAdmin, unlockAdmin } from '../lib/voter'

export function AdminPage() {
  const [secret, setSecret] = useState('')
  const [unlocked, setUnlocked] = useState(isAdminUnlocked())

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (unlockAdmin(secret, adminSecret)) {
      setUnlocked(true)
    }
  }

  if (!adminSecret) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h1 className="text-xl font-semibold text-white">Admin</h1>
        <p className="mt-2 text-sm text-amber-200">
          Set <code className="rounded bg-slate-900 px-1.5 py-0.5">VITE_ADMIN_SECRET</code> in your{' '}
          <code className="rounded bg-slate-900 px-1.5 py-0.5">.env</code> file to enable the admin panel.
        </p>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-2xl font-bold text-white">Admin</h1>
        <p className="mb-6 text-sm text-slate-400">Enter your admin secret to continue.</p>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Unlock
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-sm text-slate-400">Poll management — coming soon.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            lockAdmin()
            setUnlocked(false)
          }}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:text-white"
        >
          Lock
        </button>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="font-semibold text-white">Next up</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-slate-400">
          <li>Create polls with multiple options</li>
          <li>Assign categories and schedule close times</li>
          <li>Publish drafts and close active polls</li>
          <li>Moderate comments</li>
        </ul>
        <p className="text-xs text-slate-600">
          For now, manage polls directly in the Supabase dashboard or SQL editor.
        </p>
      </div>
    </div>
  )
}
