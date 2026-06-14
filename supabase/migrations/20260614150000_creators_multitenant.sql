-- Multi-tenant creators: pages, auth-linked management, subscriptions stub.

-- ---------------------------------------------------------------------------
-- Creators
-- ---------------------------------------------------------------------------

CREATE TABLE public.creators (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  display_name  text NOT NULL,
  auth_user_id  uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creators_slug_format CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$')
);

CREATE INDEX creators_auth_user_idx ON public.creators (auth_user_id);

CREATE TABLE public.creator_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   uuid NOT NULL UNIQUE REFERENCES public.creators(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'trialing',
  plan         text NOT NULL DEFAULT 'starter',
  amount_cents int NOT NULL DEFAULT 99,
  currency     text NOT NULL DEFAULT 'EUR',
  provider     text NOT NULL DEFAULT 'mock',
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_subscriptions_status_check
    CHECK (status IN ('trialing', 'active', 'canceled', 'past_due'))
);

-- ---------------------------------------------------------------------------
-- Link polls to creators (slug unique per creator, not globally)
-- ---------------------------------------------------------------------------

ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES public.creators(id) ON DELETE CASCADE;

INSERT INTO public.creators (slug, display_name)
VALUES ('climbby', 'Climbby')
ON CONFLICT (slug) DO NOTHING;

UPDATE public.polls
SET creator_id = (SELECT id FROM public.creators WHERE slug = 'climbby')
WHERE creator_id IS NULL;

ALTER TABLE public.polls
  ALTER COLUMN creator_id SET NOT NULL;

ALTER TABLE public.polls DROP CONSTRAINT IF EXISTS polls_slug_key;

ALTER TABLE public.polls
  ADD CONSTRAINT polls_creator_slug_key UNIQUE (creator_id, slug);

CREATE INDEX polls_creator_idx ON public.polls (creator_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.creator_id_for_user(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT id FROM public.creators WHERE auth_user_id = user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.verify_creator_owner(creator_id_input uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT creator_id_input = private.creator_id_for_user(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_creator_slug_available(slug_input text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text := lower(trim(slug_input));
BEGIN
  IF normalized IS NULL OR char_length(normalized) < 2 THEN
    RETURN false;
  END IF;

  IF normalized !~ '^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$' THEN
    RETURN false;
  END IF;

  IF normalized = ANY (ARRAY[
    'admin', 'manage', 'polls', 'archive', 'api', 'app', 'login', 'signup', 'www'
  ]) THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.creators WHERE slug = normalized
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_creator_by_slug(slug_input text)
RETURNS TABLE (
  id           uuid,
  slug         text,
  display_name text,
  created_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.slug, c.display_name, c.created_at
  FROM public.creators c
  WHERE c.slug = lower(trim(slug_input));
$$;

-- ---------------------------------------------------------------------------
-- Claim page (auth required — anonymous or email user)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_creator_page(
  slug_input text,
  display_name_input text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  normalized_slug text := lower(trim(slug_input));
  normalized_name text := trim(display_name_input);
  new_creator_id uuid;
  existing_creator_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  IF char_length(normalized_name) < 2 THEN
    RAISE EXCEPTION 'Display name must be at least 2 characters';
  END IF;

  IF NOT public.is_creator_slug_available(normalized_slug) THEN
    RAISE EXCEPTION 'This page URL is not available';
  END IF;

  SELECT id INTO existing_creator_id
  FROM public.creators
  WHERE auth_user_id = auth.uid();

  IF existing_creator_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a polls page';
  END IF;

  INSERT INTO public.creators (slug, display_name, auth_user_id)
  VALUES (normalized_slug, normalized_name, auth.uid())
  RETURNING id INTO new_creator_id;

  INSERT INTO public.creator_subscriptions (creator_id, status, provider)
  VALUES (new_creator_id, 'active', 'mock');

  RETURN jsonb_build_object(
    'creator_id', new_creator_id,
    'slug', normalized_slug,
    'display_name', normalized_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_creator()
RETURNS TABLE (
  id           uuid,
  slug         text,
  display_name text,
  created_at   timestamptz,
  active_polls bigint,
  closed_polls bigint,
  total_votes  bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  creator_row public.creators%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO creator_row
  FROM public.creators
  WHERE auth_user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    creator_row.id,
    creator_row.slug,
    creator_row.display_name,
    creator_row.created_at,
    COUNT(*) FILTER (WHERE p.status = 'active') AS active_polls,
    COUNT(*) FILTER (WHERE p.status = 'closed') AS closed_polls,
    COUNT(DISTINCT v.id) AS total_votes
  FROM public.polls p
  LEFT JOIN public.poll_votes v ON v.poll_id = p.id
  WHERE p.creator_id = creator_row.id
  GROUP BY creator_row.id, creator_row.slug, creator_row.display_name, creator_row.created_at;
END;
$$;

-- ---------------------------------------------------------------------------
-- Creator poll management (authenticated owner)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.creator_list_polls()
RETURNS TABLE (
  id              uuid,
  slug            text,
  title           text,
  description     text,
  category_id     uuid,
  category_name   text,
  status          public.poll_status,
  allow_comments  boolean,
  vote_count      bigint,
  comment_count   bigint,
  created_at      timestamptz,
  closed_at       timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  owner_id uuid := private.creator_id_for_user(auth.uid());
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No polls page found for this account';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.title,
    p.description,
    p.category_id,
    c.name AS category_name,
    p.status,
    p.allow_comments,
    COUNT(DISTINCT v.id) AS vote_count,
    COUNT(DISTINCT cm.id) AS comment_count,
    p.created_at,
    p.closed_at
  FROM public.polls p
  LEFT JOIN public.poll_categories c ON c.id = p.category_id
  LEFT JOIN public.poll_votes v ON v.poll_id = p.id
  LEFT JOIN public.poll_comments cm ON cm.poll_id = p.id
  WHERE p.creator_id = owner_id
  GROUP BY p.id, c.name
  ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.creator_create_poll(
  slug_input text,
  title_input text,
  description_input text DEFAULT NULL,
  category_id_input uuid DEFAULT NULL,
  allow_comments_input boolean DEFAULT true,
  status_input public.poll_status DEFAULT 'draft',
  options_input jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  owner_id uuid := private.creator_id_for_user(auth.uid());
  new_poll_id uuid;
  option_row jsonb;
  option_index int := 0;
  option_count int;
  normalized_slug text := lower(trim(slug_input));
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No polls page found for this account';
  END IF;

  IF char_length(normalized_slug) < 2 THEN
    RAISE EXCEPTION 'Slug must be at least 2 characters';
  END IF;

  IF char_length(trim(title_input)) < 3 THEN
    RAISE EXCEPTION 'Title must be at least 3 characters';
  END IF;

  option_count := jsonb_array_length(options_input);
  IF option_count < 2 THEN
    RAISE EXCEPTION 'At least 2 options are required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.polls
    WHERE creator_id = owner_id AND slug = normalized_slug
  ) THEN
    RAISE EXCEPTION 'You already have a poll with this slug';
  END IF;

  INSERT INTO public.polls (
    creator_id, slug, title, description, category_id, allow_comments, status
  )
  VALUES (
    owner_id,
    normalized_slug,
    trim(title_input),
    NULLIF(trim(description_input), ''),
    category_id_input,
    allow_comments_input,
    status_input
  )
  RETURNING id INTO new_poll_id;

  FOR option_row IN SELECT * FROM jsonb_array_elements(options_input)
  LOOP
    option_index := option_index + 1;
    INSERT INTO public.poll_options (poll_id, label, sort_order, color)
    VALUES (
      new_poll_id,
      trim(option_row->>'label'),
      option_index,
      NULLIF(trim(option_row->>'color'), '')
    );
  END LOOP;

  RETURN new_poll_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.creator_set_poll_status(
  poll_id_input uuid,
  status_input public.poll_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  owner_id uuid := private.creator_id_for_user(auth.uid());
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No polls page found for this account';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.polls
    WHERE id = poll_id_input AND creator_id = owner_id
  ) THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  UPDATE public.polls
  SET
    status = status_input,
    closed_at = CASE
      WHEN status_input = 'closed' THEN now()
      ELSE NULL
    END
  WHERE id = poll_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.creator_delete_comment(comment_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  owner_id uuid := private.creator_id_for_user(auth.uid());
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No polls page found for this account';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.poll_comments cm
    JOIN public.polls p ON p.id = cm.poll_id
    WHERE cm.id = comment_id_input AND p.creator_id = owner_id
  ) THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;

  DELETE FROM public.poll_comments WHERE id = comment_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.creator_list_comments(poll_id_input uuid)
RETURNS TABLE (
  id           uuid,
  poll_id      uuid,
  author_name  text,
  body         text,
  option_id    uuid,
  created_at   timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  owner_id uuid := private.creator_id_for_user(auth.uid());
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No polls page found for this account';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.polls
    WHERE id = poll_id_input AND creator_id = owner_id
  ) THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  RETURN QUERY
  SELECT c.id, c.poll_id, c.author_name, c.body, c.option_id, c.created_at
  FROM public.poll_comments c
  WHERE c.poll_id = poll_id_input
  ORDER BY c.created_at DESC;
END;
$$;

-- ---------------------------------------------------------------------------
-- Vote RPC — scoped by creator + poll slug
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cast_poll_vote(
  creator_slug_input text,
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
  SELECT p.* INTO poll_row
  FROM public.polls p
  JOIN public.creators c ON c.id = p.creator_id
  WHERE c.slug = lower(trim(creator_slug_input))
    AND p.slug = lower(trim(poll_slug_input));

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
-- Admin create poll — attach to climbby creator
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_create_poll(
  admin_secret_input text,
  slug_input text,
  title_input text,
  description_input text DEFAULT NULL,
  category_id_input uuid DEFAULT NULL,
  allow_comments_input boolean DEFAULT true,
  status_input public.poll_status DEFAULT 'draft',
  options_input jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  climbby_id uuid;
  new_poll_id uuid;
  option_row jsonb;
  option_index int := 0;
  option_count int;
  normalized_slug text := lower(trim(slug_input));
BEGIN
  IF NOT private.verify_admin(admin_secret_input) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id INTO climbby_id FROM public.creators WHERE slug = 'climbby';
  IF climbby_id IS NULL THEN
    RAISE EXCEPTION 'Default creator missing';
  END IF;

  IF char_length(normalized_slug) < 2 THEN
    RAISE EXCEPTION 'Slug must be at least 2 characters';
  END IF;

  IF char_length(trim(title_input)) < 3 THEN
    RAISE EXCEPTION 'Title must be at least 3 characters';
  END IF;

  option_count := jsonb_array_length(options_input);
  IF option_count < 2 THEN
    RAISE EXCEPTION 'At least 2 options are required';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.polls
    WHERE creator_id = climbby_id AND slug = normalized_slug
  ) THEN
    RAISE EXCEPTION 'Slug already exists';
  END IF;

  INSERT INTO public.polls (
    creator_id, slug, title, description, category_id, allow_comments, status
  )
  VALUES (
    climbby_id,
    normalized_slug,
    trim(title_input),
    NULLIF(trim(description_input), ''),
    category_id_input,
    allow_comments_input,
    status_input
  )
  RETURNING id INTO new_poll_id;

  FOR option_row IN SELECT * FROM jsonb_array_elements(options_input)
  LOOP
    option_index := option_index + 1;
    INSERT INTO public.poll_options (poll_id, label, sort_order, color)
    VALUES (
      new_poll_id,
      trim(option_row->>'label'),
      option_index,
      NULLIF(trim(option_row->>'color'), '')
    );
  END LOOP;

  RETURN new_poll_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creators are public read"
  ON public.creators FOR SELECT
  USING (true);

CREATE POLICY "owners read own subscription"
  ON public.creator_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creators c
      WHERE c.id = creator_id AND c.auth_user_id = auth.uid()
    )
  );

GRANT EXECUTE ON FUNCTION public.is_creator_slug_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_creator_page(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_creator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.creator_list_polls() TO authenticated;
GRANT EXECUTE ON FUNCTION public.creator_create_poll(text, text, text, uuid, boolean, public.poll_status, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.creator_set_poll_status(uuid, public.poll_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.creator_delete_comment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.creator_list_comments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cast_poll_vote(text, text, uuid, text, text, public.vote_source) TO anon, authenticated;
