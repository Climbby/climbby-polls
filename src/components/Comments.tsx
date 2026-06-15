import { useMemo, useState } from 'react'
import { useAuthorName } from '../lib/author-name-context'
import { formatRelative } from '../lib/time'
import type { PollComment, PollOption } from '../lib/types'
import { isOwnComment } from '../lib/voter'
import { Checkbox } from './ui/Checkbox'
import { TrashIcon } from './ui/IconButton'

interface CommentsProps {
  comments: PollComment[]
  options: PollOption[]
  disabled?: boolean
  isLoading?: boolean
  hideEmptyState?: boolean
  isSubmitting?: boolean
  isDeleting?: boolean
  deletingCommentId?: string | null
  votedOptionId?: string | null
  onSubmit: (
    authorName: string,
    body: string,
    optionId?: string | null,
    isCreator?: boolean,
  ) => void
  onDelete?: (commentId: string) => void
  isCreatorAuthor?: boolean
  animPhase?: 'enter' | 'exit'
}

export function Comments({
  comments,
  options,
  disabled,
  isLoading = false,
  hideEmptyState = false,
  isSubmitting,
  isDeleting = false,
  deletingCommentId = null,
  votedOptionId,
  onSubmit,
  onDelete,
  isCreatorAuthor = false,
  animPhase = 'enter',
}: CommentsProps) {
  const { authorName } = useAuthorName()
  const [body, setBody] = useState('')
  const [sharePick, setSharePick] = useState(false)

  const optionLabelById = useMemo(
    () => new Map(options.map((option) => [option.id, option.label])),
    [options],
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
    <div className="space-y-3">
      {!disabled && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            className="field-input min-w-[10rem] flex-1 py-2"
          />
          {votedOptionId && (
            <Checkbox
              checked={sharePick}
              onChange={(e) => setSharePick(e.target.checked)}
              label="Share my Choice"
              className="shrink-0 [&_span:last-child]:text-xs"
            />
          )}
          <button
            type="submit"
            disabled={!canPost || isSubmitting}
            className={[
              'transition-interactive shrink-0 cursor-pointer rounded-md px-3 py-2 text-sm font-medium',
              'border border-line bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink',
              'disabled:cursor-not-allowed disabled:opacity-45',
            ].join(' ')}
          >
            {isSubmitting ? '…' : 'Post'}
          </button>
        </form>
      )}

      {comments.length > 0 ? (
        <ul className="comments-thread">
          {comments.map((comment, index) => {
            const canDelete = Boolean(onDelete && isOwnComment(comment))
            const isDeletingThis = isDeleting && deletingCommentId === comment.id

            return (
              <li
                key={comment.id}
                className={[
                  'comments-thread-item',
                  animPhase === 'enter' ? 'comments-enter-item' : '',
                ].join(' ')}
                style={
                  animPhase === 'enter'
                    ? { animationDelay: `${Math.min(index, 8) * 45}ms` }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[0.6875rem] leading-tight text-ink-muted sm:text-xs">
                    <span className="font-medium text-ink-secondary">{comment.author_name}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={comment.created_at}>{formatRelative(comment.created_at)}</time>
                    {comment.option_id && optionLabelById.get(comment.option_id) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="max-w-[40%] truncate">
                          {optionLabelById.get(comment.option_id)}
                        </span>
                      </>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      aria-label="Delete your comment"
                      disabled={isDeletingThis}
                      onClick={() => onDelete?.(comment.id)}
                      className={[
                        'transition-interactive shrink-0 rounded-md p-1 text-ink-muted',
                        'hover:bg-surface-muted hover:text-danger',
                        'disabled:cursor-not-allowed disabled:opacity-45',
                      ].join(' ')}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-snug text-ink-secondary">{comment.body}</p>
              </li>
            )
          })}
        </ul>
      ) : isLoading ? null : !disabled && !hideEmptyState ? (
        <p className="text-sm text-ink-muted">No comments yet.</p>
      ) : null}
    </div>
  )
}
