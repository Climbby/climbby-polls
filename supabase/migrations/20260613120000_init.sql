-- Climbby Polls — initial schema
-- Run via Supabase CLI or paste into the SQL editor.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

CREATE TABLE public.poll_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Polls
-- ---------------------------------------------------------------------------

CREATE TYPE public.poll_status AS ENUM ('draft', 'active', 'closed');

CREATE TABLE public.polls (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  title           text NOT NULL,
  description     text,
  category_id     uuid REFERENCES public.poll_categories(id) ON DELETE SET NULL,
  status          public.poll_status NOT NULL DEFAULT 'draft',
  allow_comments  boolean NOT NULL DEFAULT true,
  closes_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz
);

CREATE INDEX polls_status_idx ON public.polls (status);
CREATE INDEX polls_category_idx ON public.polls (category_id);

-- ---------------------------------------------------------------------------
-- Options
-- ---------------------------------------------------------------------------

CREATE TABLE public.poll_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id     uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label       text NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  color       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX poll_options_poll_idx ON public.poll_options (poll_id);

-- ---------------------------------------------------------------------------
-- Votes (web + future chat bot)
-- ---------------------------------------------------------------------------

CREATE TYPE public.vote_source AS ENUM ('web', 'chat');

CREATE TABLE public.poll_votes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id      uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id    uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter_token  text NOT NULL,
  source       public.vote_source NOT NULL DEFAULT 'web',
  display_name text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, voter_token)
);

CREATE INDEX poll_votes_poll_idx ON public.poll_votes (poll_id);
CREATE INDEX poll_votes_option_idx ON public.poll_votes (option_id);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

CREATE TABLE public.poll_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id      uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  author_name  text NOT NULL,
  body         text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX poll_comments_poll_idx ON public.poll_comments (poll_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Aggregated results view (for fast reads + realtime-friendly counts)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.poll_results AS
SELECT
  p.id AS poll_id,
  o.id AS option_id,
  o.label,
  o.sort_order,
  o.color,
  COUNT(v.id)::int AS vote_count
FROM public.polls p
JOIN public.poll_options o ON o.poll_id = p.id
LEFT JOIN public.poll_votes v ON v.option_id = o.id
GROUP BY p.id, o.id, o.label, o.sort_order, o.color;

-- ---------------------------------------------------------------------------
-- Vote RPC (upsert — one vote per voter_token per poll)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  poll_slug_input text,
  option_id_input uuid,
  voter_token_input text,
  display_name_input text DEFAULT NULL,
  source_input public.vote_source DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  poll_row public.polls%ROWTYPE;
BEGIN
  SELECT * INTO poll_row
  FROM public.polls
  WHERE slug = poll_slug_input;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  IF poll_row.status <> 'active' THEN
    RAISE EXCEPTION 'Poll is not accepting votes';
  END IF;

  IF poll_row.closes_at IS NOT NULL AND poll_row.closes_at < now() THEN
    RAISE EXCEPTION 'Poll has closed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.poll_options
    WHERE id = option_id_input AND poll_id = poll_row.id
  ) THEN
    RAISE EXCEPTION 'Invalid option for this poll';
  END IF;

  INSERT INTO public.poll_votes (poll_id, option_id, voter_token, source, display_name)
  VALUES (poll_row.id, option_id_input, voter_token_input, source_input, display_name_input)
  ON CONFLICT (poll_id, voter_token)
  DO UPDATE SET
    option_id = EXCLUDED.option_id,
    display_name = EXCLUDED.display_name,
    updated_at = now();
END;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.poll_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_comments ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "categories are public"
  ON public.poll_categories FOR SELECT
  USING (true);

CREATE POLICY "active and closed polls are public"
  ON public.polls FOR SELECT
  USING (status IN ('active', 'closed'));

CREATE POLICY "options are public"
  ON public.poll_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_id AND p.status IN ('active', 'closed')
    )
  );

CREATE POLICY "votes are public read"
  ON public.poll_votes FOR SELECT
  USING (true);

CREATE POLICY "comments are public read"
  ON public.poll_comments FOR SELECT
  USING (true);

-- Anonymous visitors can vote and comment on active polls
CREATE POLICY "anyone can vote via rpc"
  ON public.poll_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_id AND p.status = 'active'
    )
  );

CREATE POLICY "anyone can comment on active polls"
  ON public.poll_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_id
        AND p.status = 'active'
        AND p.allow_comments = true
    )
  );

-- Admin writes use the service role key (bypasses RLS) or future auth.
-- No public INSERT/UPDATE on polls, categories, or options.

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_comments;

-- ---------------------------------------------------------------------------
-- Seed data (demo poll)
-- ---------------------------------------------------------------------------

INSERT INTO public.poll_categories (slug, name, description, sort_order)
VALUES
  ('community', 'Community', 'Polls about the community and what to build next', 1),
  ('fun', 'Fun', 'Lighthearted polls and silly debates', 2),
  ('tech', 'Tech', 'Programming, tools, and engineering opinions', 3);

WITH new_poll AS (
  INSERT INTO public.polls (slug, title, description, category_id, status, allow_comments)
  SELECT
    'welcome-poll',
    'What should Climbby poll about next?',
    'A starter poll to test live voting. Pick your favorite topic!',
    c.id,
    'active',
    true
  FROM public.poll_categories c
  WHERE c.slug = 'community'
  RETURNING id
)
INSERT INTO public.poll_options (poll_id, label, sort_order, color)
SELECT id, label, sort_order, color
FROM new_poll,
LATERAL (VALUES
  ('More coding streams', 1, '#6366f1'),
  ('Game tournaments', 2, '#22c55e'),
  ('Random fun debates', 3, '#f59e0b'),
  ('Open Q&A sessions', 4, '#ec4899')
) AS opts(label, sort_order, color);
