import { useState } from 'react'
import { CreatePollForm } from '../components/admin/CreatePollForm'
import { PollManageList } from '../components/admin/PollManageList'
import { SetupBanner } from '../components/SetupBanner'
import { adminSecret } from '../lib/supabase'
import { isAdminUnlocked, lockAdmin, unlockAdmin } from '../lib/voter'

type AdminTab = 'create' | 'manage'

export function AdminPage() {
  const [secret, setSecret] = useState('')
  const [unlocked, setUnlocked] = useState(isAdminUnlocked())
  const [tab, setTab] = useState<AdminTab>('create')
  const [createdMessage, setCreatedMessage] = useState<string | null>(null)

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
          <code className="rounded bg-slate-900 px-1.5 py-0.5">.env</code> (and Vercel) to enable the admin panel.
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
      <SetupBanner />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-sm text-slate-400">Create polls, publish, close, and moderate comments.</p>
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

      <div className="mb-6 flex gap-2">
        {(['create', 'manage'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-medium transition',
              tab === value
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white',
            ].join(' ')}
          >
            {value === 'create' ? 'Create poll' : 'Manage polls'}
          </button>
        ))}
      </div>

      {createdMessage && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {createdMessage}
        </p>
      )}

      {tab === 'create' ? (
        <CreatePollForm
          onCreated={(pollId) => {
            setCreatedMessage(`Poll created (${pollId.slice(0, 8)}…). Switch to Manage polls to publish it.`)
            setTab('manage')
          }}
        />
      ) : (
        <PollManageList />
      )}
    </div>
  )
}
