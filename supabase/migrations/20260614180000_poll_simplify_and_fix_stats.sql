-- Fix creator dashboard poll counts (JOIN inflated rows per vote).
-- Auto slug from title, default new polls to active, creator comment flag.

ALTER TABLE public.poll_comments
  ADD COLUMN IF NOT EXISTS is_creator boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION private.unique_poll_slug(creator_id_input uuid, title_input text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public, private
AS $$
DECLARE
  base text;
  candidate text;
  n int := 0;
BEGIN
  base := lower(regexp_replace(trim(title_input), '[^a-z0-9]+', '-', 'g'));
  base := trim(both '-' from base);

  IF char_length(base) < 2 THEN
    base := 'poll';
  END IF;

  candidate := base;

  WHILE EXISTS (
    SELECT 1 FROM public.polls
    WHERE creator_id = creator_id_input AND slug = candidate
  ) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;

  RETURN candidate;
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
    (
      SELECT COUNT(*)::bigint FROM public.polls p
      WHERE p.creator_id = creator_row.id AND p.status = 'active'
    ) AS active_polls,
    (
      SELECT COUNT(*)::bigint FROM public.polls p
      WHERE p.creator_id = creator_row.id AND p.status = 'closed'
    ) AS closed_polls,
    (
      SELECT COUNT(*)::bigint FROM public.poll_votes v
      JOIN public.polls p ON p.id = v.poll_id
      WHERE p.creator_id = creator_row.id
    ) AS total_votes;
END;
$$;

CREATE OR REPLACE FUNCTION public.creator_create_poll(
  slug_input text,
  title_input text,
  description_input text DEFAULT NULL,
  category_id_input uuid DEFAULT NULL,
  allow_comments_input boolean DEFAULT true,
  status_input public.poll_status DEFAULT 'active',
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
  normalized_slug text := NULLIF(lower(trim(slug_input)), '');
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No polls page found for this account';
  END IF;

  IF char_length(trim(title_input)) < 3 THEN
    RAISE EXCEPTION 'Title must be at least 3 characters';
  END IF;

  option_count := jsonb_array_length(options_input);
  IF option_count < 2 THEN
    RAISE EXCEPTION 'At least 2 options are required';
  END IF;

  IF normalized_slug IS NULL THEN
    normalized_slug := private.unique_poll_slug(owner_id, title_input);
  END IF;

  IF char_length(normalized_slug) < 2 THEN
    RAISE EXCEPTION 'Slug must be at least 2 characters';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.polls
    WHERE creator_id = owner_id AND slug = normalized_slug
  ) THEN
    normalized_slug := private.unique_poll_slug(owner_id, title_input);
  END IF;

  INSERT INTO public.polls (
    creator_id, slug, title, description, category_id, allow_comments, status
  )
  VALUES (
    owner_id,
    normalized_slug,
    trim(title_input),
    NULL,
    NULL,
    allow_comments_input,
    COALESCE(status_input, 'active'::public.poll_status)
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
      NULL
    );
  END LOOP;

  RETURN new_poll_id;
END;
$$;
