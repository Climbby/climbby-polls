import { useAuthorName } from '../lib/author-name-context'

export function AuthorNameInput() {
  const { authorName, setAuthorName } = useAuthorName()

  return (
    <input
      type="text"
      value={authorName}
      onChange={(e) => setAuthorName(e.target.value)}
      placeholder="Name"
      maxLength={40}
      aria-label="Your name"
      className="top-bar-input"
    />
  )
}
