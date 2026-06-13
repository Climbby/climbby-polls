import { useState } from 'react'
import type { PollComment } from '../lib/types'
import { Button } from './ui/Button'

interface CommentsProps {
  comments: PollComment[]
  disabled?: boolean
  isSubmitting?: boolean
  onSubmit: (authorName: string, body: string) => void
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function Comments({ comments, disabled, isSubmitting, onSubmit }: CommentsProps) {
  const [authorName, setAuthorName] = useState('')
  const [body, setBody] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!authorName.trim() || !body.trim()) return
    onSubmit(authorName, body)
    setBody('')
  }

  return (
    <div className="space-y-4">
      {comments.length > 0 && (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-ink">{comment.author_name}</span>
                <time className="text-xs text-ink-muted">{formatTime(comment.created_at)}</time>
              </div>
              <p className="mt-1 text-sm text-ink-secondary">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={40}
            className="field-input"
          />
          <textarea
            placeholder="Comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={2}
            className="field-input resize-none"
          />
          <Button type="submit" variant="secondary" disabled={isSubmitting || !authorName.trim() || !body.trim()}>
            {isSubmitting ? 'Posting…' : 'Post'}
          </Button>
        </form>
      )}
    </div>
  )
}
