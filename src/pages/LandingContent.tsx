import { Link } from 'react-router'
import { ClaimPageForm } from '../components/ClaimPageForm'
import { PageSearchBar } from '../components/landing/PageSearchBar'
import { Button } from '../components/ui/Button'
import { useMyCreator } from '../hooks/useCreator'
import { tenantRoutes } from '../lib/tenants/routes'

const FEATURES = [
  {
    title: 'Your own polls page',
    description: 'Claim a short URL at /yourname and share one link for every poll you run.',
  },
  {
    title: 'Live voting',
    description: 'Results update in real time as people vote — no refresh needed.',
  },
  {
    title: 'Comments on every poll',
    description: 'Let your audience explain their picks and spark discussion.',
  },
  {
    title: 'Manage dashboard',
    description: 'Create polls, pin favorites, and track stats from one place.',
  },
] as const

const STEPS = [
  {
    step: '1',
    title: 'Claim your page',
    description: 'Pick a name and URL — one-time €0.99 to get started.',
  },
  {
    step: '2',
    title: 'Create polls',
    description: 'Add questions, options, and timeframes from your dashboard.',
  },
  {
    step: '3',
    title: 'Share & watch live',
    description: 'Send your page link and watch votes and comments roll in.',
  },
] as const

export function LandingContent() {
  const { data: existingCreator } = useMyCreator()

  return (
    <div className="landing">
      <section className="landing-hero">
        <p className="landing-hero__lead">
          Climbby Polls gives creators a dedicated home for community questions — live results,
          threaded comments, and a simple dashboard to run it all.
        </p>
        <PageSearchBar />
        <p className="landing-hero__hint">
          Search for a page above, or scroll down to claim your own.
        </p>
      </section>

      <section className="landing-section" aria-labelledby="landing-features">
        <h2 id="landing-features" className="landing-section__title">
          What you get
        </h2>
        <ul className="landing-features">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="landing-feature poll-block">
              <h3 className="landing-feature__title">{feature.title}</h3>
              <p className="landing-feature__text">{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section" aria-labelledby="landing-pricing">
        <h2 id="landing-pricing" className="landing-section__title">
          Pricing
        </h2>
        <div className="landing-pricing poll-block">
          <div className="landing-pricing__price">
            <span className="landing-pricing__amount">€0.99</span>
            <span className="landing-pricing__term">one-time</span>
          </div>
          <p className="landing-pricing__text">
            Claim your polls page once and keep it forever. No subscription, no hidden fees — just
            your URL, unlimited polls, and full access to voting, comments, and your manage
            dashboard.
          </p>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-how">
        <h2 id="landing-how" className="landing-section__title">
          How it works
        </h2>
        <ol className="landing-steps">
          {STEPS.map((item) => (
            <li key={item.step} className="landing-step poll-block">
              <span className="landing-step__number" aria-hidden="true">
                {item.step}
              </span>
              <div>
                <h3 className="landing-step__title">{item.title}</h3>
                <p className="landing-step__text">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="landing-claim">
        <h2 id="landing-claim" className="landing-section__title">
          {existingCreator ? 'Your page' : 'Claim your page'}
        </h2>
        <div className="poll-block p-6 md:p-8">
          {existingCreator ? (
            <div className="landing-claim-existing">
              <p className="landing-claim-existing__text">
                You already have a polls page at{' '}
                <span className="font-medium text-ink">/{existingCreator.slug}</span>. Head there
                to create polls, manage settings, and share with your audience.
              </p>
              <Link to={tenantRoutes(existingCreator.slug).home} className="inline-block">
                <Button>Go to your page</Button>
              </Link>
            </div>
          ) : (
            <ClaimPageForm />
          )}
        </div>
      </section>
    </div>
  )
}
