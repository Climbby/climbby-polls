-- Attach optional poll pick to comments for shared-vote discussion threads.

ALTER TABLE public.poll_comments
  ADD COLUMN IF NOT EXISTS option_id uuid REFERENCES public.poll_options(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS poll_comments_option_idx ON public.poll_comments (poll_id, option_id);

DROP POLICY IF EXISTS "anyone can comment on active polls" ON public.poll_comments;

CREATE POLICY "anyone can comment on active polls"
  ON public.poll_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_id
        AND p.status = 'active'
        AND p.allow_comments = true
    )
    AND (
      option_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.poll_options o
        WHERE o.id = option_id AND o.poll_id = poll_comments.poll_id
      )
    )
  );

DROP FUNCTION IF EXISTS public.admin_list_comments(text, uuid);

CREATE FUNCTION public.admin_list_comments(
  admin_secret_input text,
  poll_id_input uuid
)
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
BEGIN
  IF NOT private.verify_admin(admin_secret_input) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT c.id, c.poll_id, c.author_name, c.body, c.option_id, c.created_at
  FROM public.poll_comments c
  WHERE c.poll_id = poll_id_input
  ORDER BY c.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_comments(text, uuid) TO anon, authenticated;
