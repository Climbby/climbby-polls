import { ClaimPageForm } from '../components/ClaimPageForm'
import { useMyCreator } from '../hooks/useCreator'

export function LandingContent() {
  const { data: existingCreator } = useMyCreator()

  if (existingCreator) {
    return null
  }

  return (
    <div className="poll-block p-6 md:p-8">
      <ClaimPageForm />
    </div>
  )
}
