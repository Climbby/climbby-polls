import { Navigate, Route, Routes } from 'react-router'
import { Layout } from '../components/Layout'
import { AdminPage } from '../pages/AdminPage'
import { AuthCallbackPage } from '../pages/AuthCallbackPage'
import { CreatorManagePage } from '../pages/CreatorManagePage'
import { LandingPage } from '../pages/LandingPage'
import { LegacyPollRedirectPage } from '../pages/LegacyPollRedirectPage'
import { TenantPollRedirectPage } from '../pages/TenantPollRedirectPage'
import { TenantPollsPage } from '../pages/TenantPollsPage'
import { tenantRoutes } from '../lib/tenants/routes'

export function AppRoutes() {
  const climbby = tenantRoutes('climbby')

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route element={<Layout />}>
        <Route path="climbby/admin" element={<AdminPage />} />
        <Route path="polls/:slug" element={<LegacyPollRedirectPage />} />
        <Route path="archive" element={<Navigate to={climbby.home} replace />} />
        <Route path="admin" element={<Navigate to={`${climbby.home}/admin`} replace />} />

        <Route path=":tenantSlug/manage" element={<CreatorManagePage />} />
        <Route path=":tenantSlug/polls/:slug" element={<TenantPollRedirectPage />} />
        <Route path=":tenantSlug" element={<TenantPollsPage />} />
      </Route>
    </Routes>
  )
}
