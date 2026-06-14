import type { CreatorDashboard } from '../../lib/types'
import { Card } from '../ui/Card'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="!p-4 text-center">
      <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{label}</p>
    </Card>
  )
}

export function CreatorDashboardStats({ dashboard }: { dashboard: CreatorDashboard }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Active polls" value={dashboard.active_polls} />
      <Stat label="Closed polls" value={dashboard.closed_polls} />
      <Stat label="Total votes" value={dashboard.total_votes} />
    </div>
  )
}
