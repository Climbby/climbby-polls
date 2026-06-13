import { useState } from 'react'
import type { PollComment } from '../lib/types'

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
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Comments</h3>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3"
            >
              <header className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-indigo-300">{comment.author_name}</span>
                <time className="text-xs text-slate-600">{formatTime(comment.created_at)}</time>
              </header>
              <p className="text-sm text-slate-300">{comment.body}</p>
            </article>
          ))
        )}
      </div>

      {!disabled && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={40}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            placeholder="Share your thoughts…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !authorName.trim() || !body.trim()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      )}
    </div>
  )
}
