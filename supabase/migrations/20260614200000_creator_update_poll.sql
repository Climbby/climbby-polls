-- Creator poll settings: rate-limited option/title updates.

CREATE TABLE IF NOT EXISTS private.creator_poll_edit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  poll_id     uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  edited_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_poll_edit_log_creator_time_idx
  ON private.creator_poll_edit_log (creator_id, edited_at DESC);

CREATE INDEX IF NOT EXISTS creator_poll_edit_log_poll_time_idx
  ON private.creator_poll_edit_log (poll_id, edited_at DESC);

CREATE OR REPLACE FUNCTION public.creator_update_poll(
  poll_id_input uuid,
  title_input text,
  allow_comments_input boolean,
  options_input jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  owner_id uuid := private.creator_id_for_user(auth.uid());
  poll_row public.polls%ROWTYPE;
  vote_count bigint;
  option_row jsonb;
  option_index int := 0;
  option_count int;
  existing_option_count int;
  payload_ids uuid[];
  existing_ids uuid[];
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'No polls page found for this account';
  END IF;

  SELECT * INTO poll_row
  FROM public.polls
  WHERE id = poll_id_input AND creator_id = owner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  IF char_length(trim(title_input)) < 3 OR char_length(trim(title_input)) > 200 THEN
    RAISE EXCEPTION 'Title must be 3–200 characters';
  END IF;

  option_count := jsonb_array_length(options_input);
  IF option_count < 2 OR option_count > 8 THEN
    RAISE EXCEPTION 'Polls need 2–8 options';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM private.creator_poll_edit_log
    WHERE poll_id = poll_id_input
      AND edited_at > now() - interval '30 seconds'
  ) THEN
    RAISE EXCEPTION 'Please wait 30 seconds between edits';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM private.creator_poll_edit_log
    WHERE poll_id = poll_id_input
      AND edited_at > now() - interval '1 hour'
  ) >= 12 THEN
    RAISE EXCEPTION 'Too many edits to this poll — try again later';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM private.creator_poll_edit_log
    WHERE creator_id = owner_id
      AND edited_at > now() - interval '1 hour'
  ) >= 40 THEN
    RAISE EXCEPTION 'Too many edits — try again later';
  END IF;

  SELECT COUNT(*) INTO vote_count
  FROM public.poll_votes
  WHERE poll_id = poll_id_input;

  SELECT COUNT(*) INTO existing_option_count
  FROM public.poll_options
  WHERE poll_id = poll_id_input;

  IF vote_count > 0 THEN
    IF option_count <> existing_option_count THEN
      RAISE EXCEPTION 'Cannot add or remove options after voting has started';
    END IF;

    SELECT array_agg((elem->>'id')::uuid ORDER BY ord)
    INTO payload_ids
    FROM jsonb_array_elements(options_input) WITH ORDINALITY AS t(elem, ord);

    IF payload_ids IS NULL OR EXISTS (SELECT 1 FROM unnest(payload_ids) id WHERE id IS NULL) THEN
      RAISE EXCEPTION 'Existing options must keep their ids once voting has started';
    END IF;

    SELECT array_agg(id ORDER BY sort_order)
    INTO existing_ids
    FROM public.poll_options
    WHERE poll_id = poll_id_input;

    IF payload_ids <> existing_ids THEN
      RAISE EXCEPTION 'Cannot reorder options after voting has started';
    END IF;

    FOR option_row IN SELECT * FROM jsonb_array_elements(options_input)
    LOOP
      IF char_length(trim(option_row->>'label')) < 1
        OR char_length(trim(option_row->>'label')) > 120 THEN
        RAISE EXCEPTION 'Each option needs 1–120 characters';
      END IF;

      UPDATE public.poll_options
      SET label = trim(option_row->>'label')
      WHERE id = (option_row->>'id')::uuid
        AND poll_id = poll_id_input;
    END LOOP;
  ELSE
    FOR option_row IN SELECT * FROM jsonb_array_elements(options_input)
    LOOP
      IF char_length(trim(option_row->>'label')) < 1
        OR char_length(trim(option_row->>'label')) > 120 THEN
        RAISE EXCEPTION 'Each option needs 1–120 characters';
      END IF;
    END LOOP;

    DELETE FROM public.poll_options WHERE poll_id = poll_id_input;

    FOR option_row IN SELECT * FROM jsonb_array_elements(options_input)
    LOOP
      option_index := option_index + 1;
      INSERT INTO public.poll_options (poll_id, label, sort_order, color)
      VALUES (
        poll_id_input,
        trim(option_row->>'label'),
        option_index,
        NULL
      );
    END LOOP;
  END IF;

  UPDATE public.polls
  SET
    title = trim(title_input),
    allow_comments = allow_comments_input
  WHERE id = poll_id_input;

  INSERT INTO private.creator_poll_edit_log (creator_id, poll_id)
  VALUES (owner_id, poll_id_input);

  DELETE FROM private.creator_poll_edit_log
  WHERE edited_at < now() - interval '7 days';
END;
$$;

GRANT EXECUTE ON FUNCTION public.creator_update_poll(uuid, text, boolean, jsonb) TO authenticated;
