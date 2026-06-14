import { Outlet } from 'react-router'
import { TopBar } from './TopBar'

export function Layout() {
  return (
    <div className="min-h-svh bg-canvas text-ink">
      <TopBar />
      <main className="mx-auto w-full max-w-2xl px-4 pb-8 pt-16 sm:px-6 md:max-w-3xl md:pb-12 md:pt-20 lg:max-w-4xl lg:px-8 lg:pb-14 lg:pt-24">
        <Outlet />
      </main>
    </div>
  )
}
