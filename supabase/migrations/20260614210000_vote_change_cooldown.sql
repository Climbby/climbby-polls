-- Allow voters to change their pick with a short anti-spam cooldown.

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
  existing_vote public.poll_votes%ROWTYPE;
BEGIN
  IF char_length(trim(voter_token_input)) < 8 THEN
    RAISE EXCEPTION 'Invalid voter token';
  END IF;

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

  SELECT * INTO existing_vote
  FROM public.poll_votes
  WHERE poll_id = poll_row.id
    AND voter_token = voter_token_input;

  IF FOUND THEN
    IF existing_vote.option_id = option_id_input THEN
      RETURN;
    END IF;

    IF existing_vote.updated_at > now() - interval '10 seconds' THEN
      RAISE EXCEPTION 'Please wait a moment before changing your vote';
    END IF;
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
