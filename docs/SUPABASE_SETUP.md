# Supabase setup — step by step

Follow these steps once to get Climbby Polls fully working locally and on Vercel.

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New project**.
3. Name it something like `climbby-polls`.
4. Choose a region close to your audience.
5. Set a strong database password and save it somewhere safe.
6. Wait for the project to finish provisioning (~2 minutes).

## 2. Run the database migrations

1. In your Supabase project, open **SQL Editor**.
2. Click **New query**.
3. Paste the full contents of `supabase/migrations/20260613120000_init.sql` and click **Run**.
4. Create a **second query**, paste `supabase/migrations/20260613140000_admin_rpcs.sql`, and click **Run**.

You should see success messages and no errors. The first migration creates tables, RLS, a demo poll, and three categories. The second adds admin RPCs.

## 3. Set the admin secret in the database

Pick a long random string (same value you'll use in Vercel/local env). Example:

```
openssl rand -base64 32
```

In the SQL Editor, run (replace `YOUR_SECRET` with your value):

```sql
INSERT INTO private.app_config (key, value)
VALUES ('admin_secret', 'YOUR_SECRET')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

This must match `VITE_ADMIN_SECRET` in your environment exactly.

## 4. Copy API keys

1. Go to **Project Settings → API**.
2. Copy **Project URL** → `VITE_SUPABASE_URL`
3. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

Never put the `service_role` key in the frontend.

## 5. Local environment

```bash
cp .env.example .env
```

Fill in:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ADMIN_SECRET=YOUR_SECRET
```

Then:

```bash
npm run dev
```

Visit http://localhost:5173 — the yellow setup banner should disappear. Try the demo poll at `/polls/welcome-poll`.

## 6. Vercel environment variables

1. Open [Vercel → climbby-polls → Settings → Environment Variables](https://vercel.com/climbbys-projects/climbby-polls/settings/environment-variables).
2. Add the same three variables for **Production** (and Preview if you want).
3. Go to **Deployments** → latest deployment → **⋯ → Redeploy**.

Live site: https://climbby-polls.vercel.app

## 7. Enable Realtime (if votes don't update live)

Realtime is enabled by the init migration. If live updates don't work:

1. Supabase → **Database → Publications**.
2. Confirm `supabase_realtime` includes `poll_votes` and `poll_comments`.

## 8. Create your first poll

1. Visit `/admin` on your deployed site.
2. Enter your admin secret.
3. Use **Create poll** to add a new poll, then **Publish** it from **Manage polls**.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Yellow setup banner | Env vars missing or wrong; redeploy after fixing |
| "Unauthorized" in admin | `VITE_ADMIN_SECRET` doesn't match `private.app_config` |
| Poll not found | Poll is still `draft` — publish it from admin |
| Can't vote | Poll must be `active` |
| No live updates | Check Realtime publication; hard-refresh the page |
