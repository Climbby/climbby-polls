import type { PollComment } from '../lib/types'
import { isOwnComment } from '../lib/voter'
import { TrashIcon } from './ui/IconButton'

type CreatorNotesLayoutPhase = 'slot-wait' | 'enter' | 'open' | 'exit'

interface CreatorCommentPanelProps {
  comments: PollComment[]
  layoutPhase?: CreatorNotesLayoutPhase
  onDelete?: (commentId: string) => void
  isDeleting?: boolean
  deletingCommentId?: string | null
}

export function CreatorCommentPanel({
  comments,
  layoutPhase = 'open',
  onDelete,
  isDeleting = false,
  deletingCommentId = null,
}: CreatorCommentPanelProps) {
  if (comments.length === 0) return null

  return (
    <aside
      className={[
        'poll-block poll-creator-notes',
        layoutPhase === 'slot-wait' ? 'poll-creator-notes--slot-wait' : '',
        layoutPhase === 'enter' ? 'poll-creator-notes--enter' : '',
        layoutPhase === 'exit' ? 'poll-creator-notes--exit' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Creator notes"
    >
      <div className="poll-creator-notes__shell">
        <header className="poll-creator-notes__header">
          <span className="poll-creator-notes__label">Creator notes</span>
        </header>
        <ul className="poll-creator-notes__list">
          {comments.map((comment, index) => {
            const canDelete = Boolean(onDelete && isOwnComment(comment))
            const isDeletingThis = isDeleting && deletingCommentId === comment.id

            return (
              <li
                key={comment.id}
                className={[
                  'poll-creator-notes__item',
                  layoutPhase === 'enter' ? 'comments-enter-item' : '',
                ].join(' ')}
                style={
                  layoutPhase === 'enter'
                    ? { animationDelay: `${Math.min(index, 8) * 45}ms` }
                    : undefined
                }
              >
                <div className="poll-creator-notes__note">
                  <p className="poll-creator-notes__body">{comment.body}</p>
                  {canDelete && (
                    <button
                      type="button"
                      aria-label="Delete your note"
                      disabled={isDeletingThis}
                      onClick={() => onDelete?.(comment.id)}
                      className={[
                        'poll-creator-notes__delete transition-interactive',
                        'rounded-md p-0.5 text-ink-muted hover:text-danger',
                        'disabled:cursor-not-allowed disabled:opacity-45',
                      ].join(' ')}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
