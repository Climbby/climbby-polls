import { useEffect } from 'react'

export const DEFAULT_DOCUMENT_TITLE = 'Polls'

export function useDocumentTitle(title: string = DEFAULT_DOCUMENT_TITLE) {
  useEffect(() => {
    document.title = title
  }, [title])
}
