import { Navigate, useParams } from 'react-router'

export function PollRedirectPage() {
  const { slug = '' } = useParams()
  return <Navigate to={{ pathname: '/', hash: slug }} replace />
}
