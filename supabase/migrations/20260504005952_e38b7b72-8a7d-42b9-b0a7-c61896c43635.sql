
-- Folders table
CREATE TABLE public.manual_timesheet_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_manual_timesheet_folders_company ON public.manual_timesheet_folders(company_id);

ALTER TABLE public.manual_timesheet_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Folders viewable by company managers"
ON public.manual_timesheet_folders FOR SELECT
USING (company_id = public.get_current_user_company_id() AND public.can_manage_manual_timesheets());

CREATE POLICY "Folders insertable by company managers"
ON public.manual_timesheet_folders FOR INSERT
WITH CHECK (company_id = public.get_current_user_company_id() AND public.can_manage_manual_timesheets() AND created_by = auth.uid());

CREATE POLICY "Folders updatable by company managers"
ON public.manual_timesheet_folders FOR UPDATE
USING (company_id = public.get_current_user_company_id() AND public.can_manage_manual_timesheets());

CREATE POLICY "Folders deletable by company managers"
ON public.manual_timesheet_folders FOR DELETE
USING (company_id = public.get_current_user_company_id() AND public.can_manage_manual_timesheets());

CREATE TRIGGER update_manual_timesheet_folders_updated_at
BEFORE UPDATE ON public.manual_timesheet_folders
FOR EACH ROW EXECUTE FUNCTION public.update_manual_timesheets_updated_at();

-- Folder items (membership)
CREATE TABLE public.manual_timesheet_folder_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL REFERENCES public.manual_timesheet_folders(id) ON DELETE CASCADE,
  timesheet_id uuid NOT NULL UNIQUE REFERENCES public.manual_timesheets(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  moved_by uuid NOT NULL,
  moved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mtfi_folder ON public.manual_timesheet_folder_items(folder_id);
CREATE INDEX idx_mtfi_company ON public.manual_timesheet_folder_items(company_id);

ALTER TABLE public.manual_timesheet_folder_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Folder items viewable by company managers"
ON public.manual_timesheet_folder_items FOR SELECT
USING (company_id = public.get_current_user_company_id() AND public.can_manage_manual_timesheets());

CREATE POLICY "Folder items insertable by company managers"
ON public.manual_timesheet_folder_items FOR INSERT
WITH CHECK (company_id = public.get_current_user_company_id() AND public.can_manage_manual_timesheets() AND moved_by = auth.uid());

CREATE POLICY "Folder items updatable by company managers"
ON public.manual_timesheet_folder_items FOR UPDATE
USING (company_id = public.get_current_user_company_id() AND public.can_manage_manual_timesheets());

CREATE POLICY "Folder items deletable by company managers"
ON public.manual_timesheet_folder_items FOR DELETE
USING (company_id = public.get_current_user_company_id() AND public.can_manage_manual_timesheets());
