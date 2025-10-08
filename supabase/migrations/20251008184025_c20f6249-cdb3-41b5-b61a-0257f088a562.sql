-- Create daily_report_comments table
CREATE TABLE public.daily_report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id uuid NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment_text text NOT NULL CHECK (char_length(comment_text) > 0 AND char_length(comment_text) <= 2000),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX idx_daily_report_comments_report_id ON public.daily_report_comments(daily_report_id, created_at ASC);
CREATE INDEX idx_daily_report_comments_user_id ON public.daily_report_comments(user_id);
CREATE INDEX idx_daily_report_comments_company_id ON public.daily_report_comments(company_id);

-- Enable RLS
ALTER TABLE public.daily_report_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: Users can view comments for reports in their company
CREATE POLICY "Users can view comments for accessible reports"
  ON public.daily_report_comments
  FOR SELECT
  USING (
    company_id = get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.id = daily_report_comments.daily_report_id
      AND dr.company_id = get_user_company_id()
    )
  );

-- INSERT: Only authorized roles can create comments
CREATE POLICY "Authorized users can create comments"
  ON public.daily_report_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id = get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'management', 'foreman')
      AND is_active = true
      AND company_id = daily_report_comments.company_id
    )
  );

-- UPDATE: Users can edit their own comments within 24 hours
CREATE POLICY "Users can update own comments within 24h"
  ON public.daily_report_comments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND created_at > (now() - interval '24 hours')
    AND company_id = get_user_company_id()
  );

-- DELETE: Admins can delete any comment, users can delete their own within 24h
CREATE POLICY "Admins can delete any comment, users their own"
  ON public.daily_report_comments
  FOR DELETE
  USING (
    company_id = get_user_company_id()
    AND (
      (user_id = auth.uid() AND created_at > (now() - interval '24 hours'))
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND company_id = daily_report_comments.company_id
      )
    )
  );

-- Create notification trigger function
CREATE OR REPLACE FUNCTION public.notify_daily_report_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  commenter_name text;
  report_author_id uuid;
  report_jobsite_name text;
  comment_preview text;
BEGIN
  -- Get commenter's full name
  SELECT CONCAT(COALESCE(up.first_name, ''), ' ', COALESCE(up.last_name, ''))
  INTO commenter_name
  FROM user_profiles up
  WHERE up.user_id = NEW.user_id;
  
  -- Clean up name (remove extra spaces)
  commenter_name := TRIM(commenter_name);
  IF commenter_name = '' THEN
    commenter_name := 'A user';
  END IF;
  
  -- Get report author and jobsite name
  SELECT dr.submitted_by, j.name
  INTO report_author_id, report_jobsite_name
  FROM daily_reports dr
  LEFT JOIN jobsites j ON j.id = dr.jobsite_id
  WHERE dr.id = NEW.daily_report_id;
  
  -- Create comment preview (first 100 chars)
  comment_preview := CASE
    WHEN LENGTH(NEW.comment_text) > 100
    THEN SUBSTRING(NEW.comment_text, 1, 100) || '...'
    ELSE NEW.comment_text
  END;
  
  -- Only notify if commenter is NOT the report author
  IF report_author_id IS NOT NULL AND report_author_id != NEW.user_id THEN
    -- Insert notification for report author
    INSERT INTO public.notifications (
      company_id,
      title,
      description,
      type,
      related_id,
      user_role,
      target_user_id,
      redirect_to
    )
    VALUES (
      NEW.company_id,
      commenter_name || ' commented on your daily report',
      '"' || comment_preview || '" – ' || COALESCE(report_jobsite_name, 'Unknown Jobsite'),
      'daily_report',
      NEW.daily_report_id,
      'admin',
      report_author_id,
      '/admin/dashboard?tab=daily-reports'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER notify_daily_report_comment_trigger
  AFTER INSERT ON public.daily_report_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_daily_report_comment();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_daily_report_comments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create updated_at trigger
CREATE TRIGGER update_daily_report_comments_updated_at
  BEFORE UPDATE ON public.daily_report_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_report_comments_updated_at();