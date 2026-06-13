# Climbby Polls

Live community polls by [Climbby](https://github.com/Climbby) — vote from a link, watch results update in real time, leave comments, and browse past polls by category.

## Status

Scaffolded (2026-06-13). Frontend shell + Supabase schema are in place. Wire up a Supabase project and start building features.

## Features (planned)

| Area | v1 | v2 |
|------|----|----|
| Browse polls by category | ✅ scaffold | |
| Vote via shareable URL (`/polls/:slug`) | ✅ scaffold | |
| Live results (Supabase Realtime) | ✅ scaffold | |
| Comments on active polls | ✅ scaffold | |
| Archive of closed polls | ✅ scaffold | |
| Admin panel (create/close polls) | stub | full UI |
| Chat voting (Twitch/YouTube bot) | | planned |

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **React Router 7** — client-side routing
- **TanStack Query 5** — data fetching + cache
- **Supabase** — Postgres, Realtime, RLS

## Quick start

```bash
cd climbby-polls
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_SECRET

npm install
npm run dev
```

### Supabase setup

1. Create a new Supabase project (dedicated to polls — separate from GuessIt).
2. Run the migration in `supabase/migrations/20260613120000_init.sql` via the SQL editor or Supabase CLI.
3. Copy the project URL + anon key into `.env`.

The seed migration creates three categories and a demo poll at `/polls/welcome-poll`.

## Project structure

```
src/
├── components/   Layout, PollCard, PollResults, VoteForm, Comments
├── hooks/        usePoll, usePolls, usePollResults
├── lib/          supabase client, types, voter identity
└── pages/        Home, Poll, Archive, Admin
```

## Vote links

Share a poll page directly:

```
https://your-domain.com/polls/welcome-poll
```

Pre-select an option via query param (future):

```
https://your-domain.com/polls/welcome-poll?vote=<option-id>
```

## Admin

Set `VITE_ADMIN_SECRET` in `.env`. Visit `/admin` and enter the secret to unlock the admin stub. Full poll management UI comes next.

## Deploy

Built for [Vercel](https://vercel.com) (static SPA). Set the same env vars in the Vercel dashboard.

## License

MIT
