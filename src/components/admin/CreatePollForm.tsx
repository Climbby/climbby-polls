import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useCreatePoll } from '../../hooks/useAdmin'
import { useCreatorCreatePoll } from '../../hooks/useCreatorManage'
import type { CreatePollOptionInput } from '../../lib/types'

function emptyOptions(): CreatePollOptionInput[] {
  return [{ label: '', color: '' }, { label: '', color: '' }]
}

interface CreatePollFormProps {
  onCreated: (pollId: string) => void
  onCancel?: () => void
  variant?: 'admin' | 'creator'
  presentation?: 'card' | 'inline'
}

export function CreatePollForm({
  onCreated,
  onCancel,
  variant = 'admin',
  presentation = 'card',
}: CreatePollFormProps) {
  const adminCreatePoll = useCreatePoll()
  const creatorCreatePoll = useCreatorCreatePoll()
  const createPoll = variant === 'creator' ? creatorCreatePoll : adminCreatePoll
  const isInline = presentation === 'inline'

  const [title, setTitle] = useState('')
  const [allowComments, setAllowComments] = useState(true)
  const [options, setOptions] = useState<CreatePollOptionInput[]>(emptyOptions)

  function updateOption(index: number, label: string) {
    setOptions((prev) => prev.map((opt, i) => (i === index ? { ...opt, label } : opt)))
  }

  function addOption() {
    setOptions((prev) => [...prev, { label: '', color: '' }])
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setTitle('')
    setAllowComments(true)
    setOptions(emptyOptions())
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    createPoll.mutate(
      {
        slug: '',
        title,
        description: '',
        categoryId: null,
        allowComments,
        status: 'active',
        options: options.filter((o) => o.label.trim()).map((o) => ({ label: o.label, color: '' })),
      },
      {
        onSuccess: (pollId) => {
          resetForm()
          onCreated(pollId)
        },
      },
    )
  }

  const optionInputClass = isInline
    ? 'field-input w-full !rounded-md !py-2.5 text-sm md:!rounded-lg md:!py-3 md:text-base'
    : 'field-input flex-1'

  const form = (
    <form onSubmit={handleSubmit} className={isInline ? 'space-y-4 md:space-y-5' : 'space-y-6'}>
      <div>
        {!isInline && <label className="field-label">Title</label>}
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isInline ? 'Poll title…' : 'What should we vote on?'}
          className={
            isInline
              ? 'w-full bg-transparent text-base font-semibold leading-snug text-ink placeholder:text-ink-muted focus:outline-none sm:text-lg md:text-xl md:leading-tight'
              : 'field-input'
          }
        />
        {isInline && (
          <p className="mt-1 text-xs text-ink-muted md:text-sm">New poll · goes live when you publish</p>
        )}
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
          {!isInline && <label className="field-label mb-0">Options</label>}
          {isInline && <span className="text-xs font-medium text-ink-muted md:text-sm">Options</span>}
          <button
            type="button"
            onClick={addOption}
            className="text-sm font-medium text-accent hover:text-accent-strong"
          >
            + Add option
          </button>
        </div>

        <div className={isInline ? 'space-y-2 md:space-y-2.5' : 'space-y-2'}>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <input
                required
                value={option.label}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className={optionInputClass}
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

      <div className={isInline ? 'flex flex-wrap gap-2 pt-1' : ''}>
        {isInline && onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 sm:flex-none">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={createPoll.isPending}
          fullWidth={!isInline}
          className={isInline ? 'flex-1 sm:min-w-[10rem]' : ''}
        >
          {createPoll.isPending ? 'Publishing…' : isInline ? 'Publish poll' : 'Create poll'}
        </Button>
      </div>
    </form>
  )

  if (isInline) {
    return (
      <article
        id="create-poll-draft"
        className="poll-block scroll-mt-6 p-4 sm:p-5 md:p-6 lg:p-7"
      >
        {form}
      </article>
    )
  }

  return <Card>{form}</Card>
}
