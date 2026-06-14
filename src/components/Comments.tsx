import { useMemo, useState } from 'react'
import { useAuthorName } from '../lib/author-name-context'
import type { PollComment, PollOption } from '../lib/types'
import { Checkbox } from './ui/Checkbox'

interface CommentsProps {
  comments: PollComment[]
  options: PollOption[]
  disabled?: boolean
  isSubmitting?: boolean
  votedOptionId?: string | null
  onSubmit: (
    authorName: string,
    body: string,
    optionId?: string | null,
    isCreator?: boolean,
  ) => void
  isCreatorAuthor?: boolean
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function filterComments(comments: PollComment[], filterOptionId: string | null) {
  if (!filterOptionId) return comments
  return comments.filter((comment) => comment.option_id === filterOptionId)
}

export function Comments({
  comments,
  options,
  disabled,
  isSubmitting,
  votedOptionId,
  onSubmit,
  isCreatorAuthor = false,
}: CommentsProps) {
  const { authorName } = useAuthorName()
  const [body, setBody] = useState('')
  const [sharePick, setSharePick] = useState(false)
  const [filterOptionId, setFilterOptionId] = useState<string | null>(null)

  const optionLabelById = useMemo(
    () => new Map(options.map((option) => [option.id, option.label])),
    [options],
  )

  const commentCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const option of options) counts.set(option.id, 0)
    for (const comment of comments) {
      if (comment.option_id) {
        counts.set(comment.option_id, (counts.get(comment.option_id) ?? 0) + 1)
      }
    }
    return counts
  }, [comments, options])

  const filteredComments = useMemo(
    () => filterComments(comments, filterOptionId),
    [comments, filterOptionId],
  )

  const creatorComments = useMemo(
    () => filteredComments.filter((comment) => comment.is_creator),
    [filteredComments],
  )

  const communityComments = useMemo(
    () => filteredComments.filter((comment) => !comment.is_creator),
    [filteredComments],
  )

  const canPost = Boolean(authorName.trim() && body.trim() && !disabled)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canPost) return
    onSubmit(authorName, body, sharePick ? votedOptionId : null, isCreatorAuthor)
    setBody('')
    setSharePick(false)
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {!disabled && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a comment…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              className="field-input min-w-0 flex-1 py-2 md:py-2.5"
            />
            <button
              type="submit"
              disabled={!canPost || isSubmitting}
              className={[
                'transition-interactive shrink-0 cursor-pointer rounded-md px-3 py-2 text-sm font-medium md:px-4 md:py-2.5',
                'border border-line bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink',
                'disabled:cursor-not-allowed disabled:opacity-45',
              ].join(' ')}
            >
              {isSubmitting ? '…' : 'Post'}
            </button>
          </div>

          {votedOptionId && (
            <Checkbox
              checked={sharePick}
              onChange={(e) => setSharePick(e.target.checked)}
              label="Share my Choice"
            />
          )}
        </form>
      )}

      {comments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={filterOptionId === null}
            label="All"
            count={comments.length}
            onClick={() => setFilterOptionId(null)}
          />
          {options.map((option) => {
            const count = commentCounts.get(option.id) ?? 0
            if (count === 0) return null
            return (
              <FilterChip
                key={option.id}
                active={filterOptionId === option.id}
                label={option.label}
                count={count}
                onClick={() => setFilterOptionId(option.id)}
              />
            )
          })}
        </div>
      )}

      {creatorComments.length > 0 && (
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">From the creator</h3>
          <ul className="space-y-2.5">
            {creatorComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                pickLabel={
                  comment.option_id ? optionLabelById.get(comment.option_id) : undefined
                }
                highlighted
              />
            ))}
          </ul>
        </section>
      )}

      {communityComments.length > 0 && (
        <ul className="space-y-3 md:space-y-3.5">
          {communityComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              pickLabel={comment.option_id ? optionLabelById.get(comment.option_id) : undefined}
            />
          ))}
        </ul>
      )}

      {filteredComments.length === 0 && filterOptionId && (
        <p className="text-sm text-ink-muted">No comments for this option yet.</p>
      )}
    </div>
  )
}

function CommentItem({
  comment,
  pickLabel,
  highlighted = false,
}: {
  comment: PollComment
  pickLabel?: string
  highlighted?: boolean
}) {
  return (
    <li
      className={[
        'border-b border-line pb-3 last:border-0 last:pb-0',
        highlighted
          ? 'rounded-lg border border-[color-mix(in_srgb,var(--accent)_25%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] px-3 py-3 last:border'
          : '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-ink md:text-base">{comment.author_name}</span>
          {pickLabel && (
            <span className="text-xs text-ink-muted md:text-sm">· {pickLabel}</span>
          )}
        </div>
        <time className="text-xs text-ink-muted">{formatTime(comment.created_at)}</time>
      </div>
      <p className="mt-1 text-sm text-ink-secondary md:text-base">{comment.body}</p>
    </li>
  )
}

function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'transition-interactive cursor-pointer rounded-md border px-2 py-1 text-xs font-medium md:px-2.5 md:py-1.5 md:text-sm',
        active
          ? 'border-[color-mix(in_srgb,var(--poll-fill)_35%,var(--line))] bg-[color-mix(in_srgb,var(--poll-fill)_12%,var(--surface))] text-ink'
          : 'border-line bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink',
      ].join(' ')}
    >
      {label}
      <span className="ml-1 tabular-nums text-ink-muted">{count}</span>
    </button>
  )
}
