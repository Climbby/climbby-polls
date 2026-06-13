# Climbby Polls

Live community polls by [Climbby](https://github.com/Climbby) — vote from a link, watch results update in real time, leave comments, and browse past polls by category.

**Live:** https://climbby-polls.vercel.app  
**Repo:** https://github.com/Climbby/climbby-polls

## Status

Admin panel + Supabase RPCs shipped (2026-06-13). Run the Supabase setup once, then create and manage polls from `/admin`.

## Features

| Area | Status |
|------|--------|
| Browse polls by category | ✅ |
| Vote via shareable URL (`/polls/:slug`) | ✅ |
| Live results (Supabase Realtime) | ✅ |
| Comments on active polls | ✅ |
| Archive of closed polls | ✅ |
| Admin panel (create/publish/close/moderate) | ✅ |
| Chat voting (Twitch/YouTube bot) | planned |

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

**Full walkthrough:** [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

Short version:

1. Create a Supabase project.
2. Run both migrations in `supabase/migrations/` (SQL editor).
3. Insert your admin secret into `private.app_config` (must match `VITE_ADMIN_SECRET`).
4. Copy URL + anon key into `.env` and Vercel.

## Admin

1. Set `VITE_ADMIN_SECRET` locally and on Vercel.
2. Sync the same value in Supabase (`private.app_config`).
3. Visit `/admin`, unlock, create polls, publish, close, moderate comments.

## Deploy

Hosted on [Vercel](https://vercel.com). After changing env vars, redeploy so Vite picks them up.

## License

MIT
