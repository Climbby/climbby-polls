-- Pin polls to the top of a creator page (admin-only toggle via RPC)

ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS polls_creator_pinned_idx
  ON public.polls (creator_id, status, pinned_at DESC NULLS LAST, created_at DESC);

-- ---------------------------------------------------------------------------
-- Admin: pin / unpin a poll
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_set_poll_pinned(
  admin_secret_input text,
  poll_id_input uuid,
  pinned_input boolean
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
  SET pinned_at = CASE WHEN pinned_input THEN now() ELSE NULL END
  WHERE id = poll_id_input;
END;
$$;

-- Re-create list RPC so admin UI can show pin state and sort pinned first
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
  closed_at       timestamptz,
  pinned_at       timestamptz
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
    p.closed_at,
    p.pinned_at
  FROM public.polls p
  LEFT JOIN public.poll_categories c ON c.id = p.category_id
  LEFT JOIN public.poll_votes v ON v.poll_id = p.id
  LEFT JOIN public.poll_comments cm ON cm.poll_id = p.id
  GROUP BY p.id, c.name
  ORDER BY p.pinned_at DESC NULLS LAST, p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_poll_pinned(text, uuid, boolean) TO anon, authenticated;
