import { useState } from 'react'
import { CreatePollForm } from '../components/admin/CreatePollForm'
import { PollManageList } from '../components/admin/PollManageList'
import { SetupBanner } from '../components/SetupBanner'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { adminSecret } from '../lib/supabase'
import { isAdminUnlocked, lockAdmin, unlockAdmin } from '../lib/voter'

type AdminTab = 'create' | 'manage'

export function AdminPage() {
  const [secret, setSecret] = useState('')
  const [unlocked, setUnlocked] = useState(isAdminUnlocked())
  const [tab, setTab] = useState<AdminTab>('create')
  const [createdMessage, setCreatedMessage] = useState<string | null>(null)

  useDocumentTitle('Admin · Polls')

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (unlockAdmin(secret, adminSecret)) {
      setUnlocked(true)
    }
  }

  if (!adminSecret) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-ink">Admin</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Set <code>VITE_ADMIN_SECRET</code> in <code>.env</code> and Vercel.
        </p>
      </Card>
    )
  }

  if (!unlocked) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-ink">Admin</h1>
        <p className="mb-4 mt-1 text-sm text-ink-secondary">Enter your secret to continue.</p>
        <Card>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin secret"
              className="field-input"
            />
            <Button type="submit" fullWidth>
              Unlock
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <SetupBanner />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Admin</h1>
          <p className="text-sm text-ink-secondary">Create and manage polls.</p>
        </div>
        <Button variant="ghost" onClick={() => { lockAdmin(); setUnlocked(false) }}>
          Lock
        </Button>
      </div>

      <div className="mb-6 flex gap-1 border-b border-line">
        {(['create', 'manage'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={[
              'border-b-2 px-3 py-2 text-sm font-medium transition',
              tab === value
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-muted hover:text-ink-secondary',
            ].join(' ')}
          >
            {value === 'create' ? 'Create' : 'Manage'}
          </button>
        ))}
      </div>

      {createdMessage && (
        <p className="mb-4 text-sm text-success">{createdMessage}</p>
      )}

      {tab === 'create' ? (
        <CreatePollForm
          onCreated={() => {
            setCreatedMessage(`Poll created. Publish it from Manage.`)
            setTab('manage')
          }}
        />
      ) : (
        <PollManageList />
      )}
    </div>
  )
}
