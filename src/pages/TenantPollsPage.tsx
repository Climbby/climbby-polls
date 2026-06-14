import { useLocation, useOutletContext, useParams } from 'react-router'
import type { PollsShellOutletContext } from '../components/layout/PollsShell'
import { TenantPollsContent } from './TenantPollsContent'

export function TenantPollsPage() {
  const { tenantSlug = '' } = useParams()
  const { hash } = useLocation()
  const { showCreateDraft, setShowCreateDraft, creator, isOwner } =
    useOutletContext<PollsShellOutletContext>()

  return (
    <TenantPollsContent
      slug={tenantSlug}
      hash={hash}
      showCreateDraft={showCreateDraft}
      setShowCreateDraft={setShowCreateDraft}
      creator={creator}
      isOwner={isOwner}
    />
  )
}
