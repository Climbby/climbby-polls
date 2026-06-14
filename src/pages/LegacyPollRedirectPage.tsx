import { Navigate, useParams } from 'react-router'
import { tenantRoutes } from '../lib/tenants/routes'

export function LegacyPollRedirectPage() {
  const { slug = '' } = useParams()
  return (
    <Navigate to={{ pathname: tenantRoutes('climbby').home, hash: slug }} replace />
  )
}
