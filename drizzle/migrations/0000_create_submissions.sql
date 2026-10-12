CREATE SEQUENCE public.submission_seq START 1;

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id text NOT NULL UNIQUE,
  student_name text NOT NULL,
  registration_number text NOT NULL,
  email text NOT NULL,
  mobile_number text NOT NULL,
  school text NOT NULL,
  department text NOT NULL,
  academic_year text NOT NULL,
  internship_company text NOT NULL,
  project_title text NOT NULL,
  faculty_guide text DEFAULT '',
  panel_number integer NOT NULL,
  faculty_name text NOT NULL,
  review_date date NOT NULL,
  pdf_file_path text,
  ppt_file_path text,
  certificate_file_path text,
  pdf_filename text,
  ppt_filename text,
  certificate_filename text,
  drive_folder_id text,
  drive_pdf_id text,
  drive_ppt_id text,
  drive_certificate_id text,
  drive_sync_status text NOT NULL DEFAULT 'pending',
  sheet_sync_status text NOT NULL DEFAULT 'pending',
  submission_status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX submissions_regno_completed_idx
  ON public.submissions (upper(registration_number))
  WHERE submission_status = 'completed';

GRANT ALL ON public.submissions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.submission_seq TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.confirmation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  submission_id text NOT NULL REFERENCES public.submissions(submission_id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.confirmation_tokens TO service_role;
ALTER TABLE public.confirmation_tokens ENABLE ROW LEVEL SECURITY;