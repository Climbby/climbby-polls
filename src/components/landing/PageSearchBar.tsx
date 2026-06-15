import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRightIcon, IconButton } from '../ui/IconButton'
import { slugify } from '../../lib/slug'
import { isValidTenantSlug } from '../../lib/tenants/routes'

export function PageSearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  function goToPage(raw: string) {
    const slug = slugify(raw)
    if (!slug) {
      setError('Enter a page name to search.')
      return
    }
    if (!isValidTenantSlug(slug)) {
      setError('Use 2–64 lowercase letters, numbers, or hyphens.')
      return
    }
    setError(null)
    navigate(`/${slug}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    goToPage(query)
  }

  return (
    <form onSubmit={handleSubmit} className="landing-search">
      <label htmlFor="page-search" className="sr-only">
        Find a polls page
      </label>
      <div className="landing-search__field">
        <span className="landing-search__prefix" aria-hidden="true">
          /
        </span>
        <input
          id="page-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (error) setError(null)
          }}
          placeholder="climbby"
          autoComplete="off"
          spellCheck={false}
          className="landing-search__input field-input"
        />
        <IconButton
          type="submit"
          label="Go to page"
          className="landing-search__submit !h-9 !w-9 shrink-0 bg-accent text-white hover:bg-accent hover:opacity-90 md:!h-10 md:!w-10"
        >
          <ArrowRightIcon />
        </IconButton>
      </div>
      {error && <p className="landing-search__error">{error}</p>}
    </form>
  )
}
