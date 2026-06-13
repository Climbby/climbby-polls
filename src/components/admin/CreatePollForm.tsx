import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useCategories } from '../../hooks/usePolls'
import { useCreatePoll } from '../../hooks/useAdmin'
import { slugify } from '../../lib/slug'
import type { CreatePollOptionInput, PollStatus } from '../../lib/types'

const DEFAULT_COLORS = ['#2dd4bf', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#f87171']

function emptyOptions(): CreatePollOptionInput[] {
  return [
    { label: '', color: DEFAULT_COLORS[0] },
    { label: '', color: DEFAULT_COLORS[1] },
  ]
}

interface CreatePollFormProps {
  onCreated: (pollId: string) => void
}

export function CreatePollForm({ onCreated }: CreatePollFormProps) {
  const { data: categories = [] } = useCategories()
  const createPoll = useCreatePoll()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [allowComments, setAllowComments] = useState(true)
  const [status, setStatus] = useState<PollStatus>('draft')
  const [options, setOptions] = useState<CreatePollOptionInput[]>(emptyOptions)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugEdited) {
      setSlug(slugify(value))
    }
  }

  function updateOption(index: number, patch: Partial<CreatePollOptionInput>) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)))
  }

  function addOption() {
    setOptions((prev) => [
      ...prev,
      { label: '', color: DEFAULT_COLORS[prev.length % DEFAULT_COLORS.length] },
    ])
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createPoll.mutate(
      {
        slug,
        title,
        description,
        categoryId: categoryId || null,
        allowComments,
        status,
        options: options.filter((o) => o.label.trim()),
      },
      {
        onSuccess: (pollId) => {
          setTitle('')
          setSlug('')
          setSlugEdited(false)
          setDescription('')
          setCategoryId('')
          setAllowComments(true)
          setStatus('draft')
          setOptions(emptyOptions())
          onCreated(pollId)
        },
      },
    )
  }

  return (
    <Card>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="field-label">Title</label>
        <input
          required
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="What should we vote on?"
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">URL slug</label>
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span>/polls/</span>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlugEdited(true)
              setSlug(slugify(e.target.value))
            }}
            className="field-input flex-1"
          />
        </div>
      </div>

      <div>
        <label className="field-label">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional context for voters"
          className="field-input resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="field-input"
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">Initial status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PollStatus)}
            className="field-input"
          >
            <option value="draft">Draft (hidden from home)</option>
            <option value="active">Active (live immediately)</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={allowComments}
          onChange={(e) => setAllowComments(e.target.checked)}
          className="rounded ring-line"
        />
        Allow comments
      </label>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="field-label mb-0">Options</label>
          <button
            type="button"
            onClick={addOption}
            className="text-sm font-medium text-accent hover:text-accent-strong"
          >
            + Add option
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="color"
                value={option.color}
                onChange={(e) => updateOption(index, { color: e.target.value })}
                className="h-11 w-12 shrink-0 cursor-pointer rounded-lg bg-canvas ring-1 ring-line"
                title="Bar color"
              />
              <input
                required
                value={option.label}
                onChange={(e) => updateOption(index, { label: e.target.value })}
                placeholder={`Option ${index + 1}`}
                className="field-input flex-1"
              />
              <button
                type="button"
                disabled={options.length <= 2}
                onClick={() => removeOption(index)}
                className="rounded-lg px-3 text-ink-muted ring-1 ring-line-soft hover:text-danger disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {createPoll.isError && (
        <p className="text-sm text-danger">
          {(createPoll.error as Error).message || 'Could not create poll.'}
        </p>
      )}

      <Button type="submit" disabled={createPoll.isPending} fullWidth>
        {createPoll.isPending ? 'Creating…' : 'Create poll'}
      </Button>
    </form>
    </Card>
  )
}
