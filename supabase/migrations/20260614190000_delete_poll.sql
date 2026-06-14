-- Delete poll RPCs for creator manage and admin.

CREATE OR REPLACE FUNCTION public.creator_delete_poll(poll_id_input uuid)
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

  DELETE FROM public.polls WHERE id = poll_id_input;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_poll(
  admin_secret_input text,
  poll_id_input uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.verify_admin_secret(admin_secret_input) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.polls WHERE id = poll_id_input) THEN
    RAISE EXCEPTION 'Poll not found';
  END IF;

  DELETE FROM public.polls WHERE id = poll_id_input;
END;
$$;

GRANT EXECUTE ON FUNCTION public.creator_delete_poll(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_poll(text, uuid) TO anon, authenticated;
