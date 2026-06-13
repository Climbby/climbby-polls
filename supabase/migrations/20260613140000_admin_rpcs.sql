-- Admin RPCs — poll management from the /admin UI
-- After running, sync the secret with VITE_ADMIN_SECRET (see docs/SUPABASE_SETUP.md).

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS private.app_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);

CREATE OR REPLACE FUNCTION private.verify_admin(admin_secret_input text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.app_config
    WHERE key = 'admin_secret'
      AND value = admin_secret_input
  );
$$;

-- ---------------------------------------------------------------------------
-- List all polls (including drafts) for admin
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_polls(admin_secret_input text)
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
BEGIN
  IF NOT private.verify_admin(admin_secret_input) THEN
    RAISE EXCEPTION 'Unauthorized';
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
  GROUP BY p.id, c.name
  ORDER BY p.created_at DESC;
END;
$$;

-- ---------------------------------------------------------------------------
-- Create poll with options
-- options_input: [{"label": "Option A", "color": "#6366f1"}, ...]
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
  new_poll_id uuid;
  option_row jsonb;
  option_index int := 0;
  option_count int;
BEGIN
  IF NOT private.verify_admin(admin_secret_input) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF char_length(trim(slug_input)) < 2 THEN
    RAISE EXCEPTION 'Slug must be at least 2 characters';
  END IF;

  IF char_length(trim(title_input)) < 3 THEN
    RAISE EXCEPTION 'Title must be at least 3 characters';
  END IF;

  option_count := jsonb_array_length(options_input);
  IF option_count < 2 THEN
    RAISE EXCEPTION 'At least 2 options are required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.polls WHERE slug = slug_input) THEN
    RAISE EXCEPTION 'Slug already exists';
  END IF;

  INSERT INTO public.polls (
    slug, title, description, category_id, allow_comments, status
  )
  VALUES (
    lower(trim(slug_input)),
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
-- Change poll status (publish draft, close active poll, etc.)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_set_poll_status(
  admin_secret_input text,
  poll_id_input uuid,
  status_input public.poll_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.verify_admin(admin_secret_input) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.polls WHERE id = poll_id_input) THEN
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

-- ---------------------------------------------------------------------------
-- Delete a comment (moderation)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_delete_comment(
  admin_secret_input text,
  comment_id_input uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.verify_admin(admin_secret_input) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM public.poll_comments WHERE id = comment_id_input;
END;
$$;

-- ---------------------------------------------------------------------------
-- List comments for a poll (admin moderation)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_comments(
  admin_secret_input text,
  poll_id_input uuid
)
RETURNS TABLE (
  id           uuid,
  poll_id      uuid,
  author_name  text,
  body         text,
  created_at   timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.verify_admin(admin_secret_input) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT c.id, c.poll_id, c.author_name, c.body, c.created_at
  FROM public.poll_comments c
  WHERE c.poll_id = poll_id_input
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_polls(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_poll(text, text, text, text, uuid, boolean, public.poll_status, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_poll_status(text, uuid, public.poll_status) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_comment(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_comments(text, uuid) TO anon, authenticated;
