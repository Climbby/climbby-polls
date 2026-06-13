import { Link, NavLink, Outlet } from 'react-router'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-500/15 text-indigo-300'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
  ].join(' ')

export function Layout() {
  return (
    <div className="min-h-svh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
              Cb
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold tracking-tight text-white group-hover:text-indigo-200">
                Climbby Polls
              </p>
              <p className="text-xs text-slate-500">Live community votes</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Active
            </NavLink>
            <NavLink to="/archive" className={navLinkClass}>
              Archive
            </NavLink>
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-600">
        Built by{' '}
        <a
          href="https://github.com/Climbby"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-400 hover:text-indigo-300"
        >
          Climbby
        </a>
      </footer>
    </div>
  )
}
