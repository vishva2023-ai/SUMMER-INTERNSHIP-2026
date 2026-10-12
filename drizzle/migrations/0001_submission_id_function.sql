CREATE OR REPLACE FUNCTION public.next_submission_id()
RETURNS text
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'SIR2026-' || lpad(nextval('public.submission_seq')::text, 6, '0');
$$;

GRANT EXECUTE ON FUNCTION public.next_submission_id() TO service_role;