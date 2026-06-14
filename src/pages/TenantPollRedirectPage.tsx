import { Navigate, useParams } from 'react-router'
import { isValidTenantSlug, tenantRoutes } from '../lib/tenants/routes'

export function TenantPollRedirectPage() {
  const { tenantSlug = '', slug = '' } = useParams()
  const normalizedSlug = tenantSlug.trim().toLowerCase()

  if (!isValidTenantSlug(normalizedSlug) || !slug) {
    return <Navigate to="/" replace />
  }

  return (
    <Navigate to={{ pathname: tenantRoutes(normalizedSlug).home, hash: slug }} replace />
  )
}
