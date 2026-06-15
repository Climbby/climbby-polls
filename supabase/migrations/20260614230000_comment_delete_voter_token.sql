-- Track comment author by voter token and allow deleting own comments.

ALTER TABLE public.poll_comments
  ADD COLUMN IF NOT EXISTS voter_token text;

CREATE INDEX IF NOT EXISTS poll_comments_voter_token_idx
  ON public.poll_comments (voter_token)
  WHERE voter_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.delete_own_comment(
  comment_id_input uuid,
  voter_token_input text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF voter_token_input IS NULL OR char_length(trim(voter_token_input)) < 1 THEN
    RAISE EXCEPTION 'Invalid voter token';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.poll_comments
    WHERE id = comment_id_input
      AND voter_token = voter_token_input
  ) THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;

  DELETE FROM public.poll_comments
  WHERE id = comment_id_input;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_comment(uuid, text) TO anon, authenticated;
