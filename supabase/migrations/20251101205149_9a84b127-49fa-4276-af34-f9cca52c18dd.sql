-- Create daily task lists table
CREATE TABLE public.daily_task_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  for_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id)
);

-- Create daily task items table (hierarchical)
CREATE TABLE public.daily_task_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.daily_task_lists(id) ON DELETE CASCADE,
  parent_item_id UUID REFERENCES public.daily_task_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  is_done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  done_by UUID REFERENCES auth.users(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task assignments table
CREATE TABLE public.daily_task_item_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.daily_task_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(item_id, user_id)
);

-- Create comments table
CREATE TABLE public.daily_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.daily_task_lists(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.daily_task_items(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((list_id IS NOT NULL AND item_id IS NULL) OR (list_id IS NULL AND item_id IS NOT NULL))
);

-- Create templates table
CREATE TABLE public.daily_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  jobsite_id UUID REFERENCES public.jobsites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activity log table
CREATE TABLE public.daily_task_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.daily_task_lists(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.daily_task_items(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_daily_task_lists_company ON public.daily_task_lists(company_id);
CREATE INDEX idx_daily_task_lists_jobsite ON public.daily_task_lists(jobsite_id);
CREATE INDEX idx_daily_task_lists_date ON public.daily_task_lists(for_date DESC);
CREATE INDEX idx_daily_task_items_list ON public.daily_task_items(list_id);
CREATE INDEX idx_daily_task_items_parent ON public.daily_task_items(parent_item_id);
CREATE INDEX idx_daily_task_items_order ON public.daily_task_items(list_id, order_index);
CREATE INDEX idx_daily_task_assignees_user ON public.daily_task_item_assignees(user_id);
CREATE INDEX idx_daily_task_comments_list ON public.daily_task_comments(list_id);
CREATE INDEX idx_daily_task_comments_item ON public.daily_task_comments(item_id);

-- Trigger for updated_at on lists
CREATE TRIGGER update_daily_task_lists_updated_at
  BEFORE UPDATE ON public.daily_task_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_reports_updated_at();

-- Trigger for updated_at on items
CREATE TRIGGER update_daily_task_items_updated_at
  BEFORE UPDATE ON public.daily_task_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_reports_updated_at();

-- Trigger for updated_at on comments
CREATE TRIGGER update_daily_task_comments_updated_at
  BEFORE UPDATE ON public.daily_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_reports_updated_at();

-- RLS Policies for daily_task_lists
ALTER TABLE public.daily_task_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lists for their company"
  ON public.daily_task_lists FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins/foremen can create lists"
  ON public.daily_task_lists FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id() AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  );

CREATE POLICY "Admins/foremen can update lists"
  ON public.daily_task_lists FOR UPDATE
  USING (
    company_id = public.get_user_company_id() AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  );

CREATE POLICY "Admins can delete lists"
  ON public.daily_task_lists FOR DELETE
  USING (
    company_id = public.get_user_company_id() AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management')
    )
  );

-- RLS Policies for daily_task_items
ALTER TABLE public.daily_task_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their company lists"
  ON public.daily_task_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_task_lists
      WHERE id = daily_task_items.list_id
      AND company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Admins/foremen can create tasks"
  ON public.daily_task_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_task_lists dtl
      JOIN public.user_profiles up ON up.user_id = auth.uid()
      WHERE dtl.id = daily_task_items.list_id
      AND dtl.company_id = up.company_id
      AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  );

CREATE POLICY "Admins/foremen can update any task"
  ON public.daily_task_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_task_lists dtl
      JOIN public.user_profiles up ON up.user_id = auth.uid()
      WHERE dtl.id = daily_task_items.list_id
      AND dtl.company_id = up.company_id
      AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  );

CREATE POLICY "Employees can update their assigned tasks"
  ON public.daily_task_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_task_item_assignees
      WHERE item_id = daily_task_items.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete tasks"
  ON public.daily_task_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_task_lists dtl
      JOIN public.user_profiles up ON up.user_id = auth.uid()
      WHERE dtl.id = daily_task_items.list_id
      AND dtl.company_id = up.company_id
      AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  );

-- RLS Policies for assignees
ALTER TABLE public.daily_task_item_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignees in their company"
  ON public.daily_task_item_assignees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_task_items dti
      JOIN public.daily_task_lists dtl ON dtl.id = dti.list_id
      WHERE dti.id = daily_task_item_assignees.item_id
      AND dtl.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Admins/foremen can manage assignees"
  ON public.daily_task_item_assignees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_task_items dti
      JOIN public.daily_task_lists dtl ON dtl.id = dti.list_id
      JOIN public.user_profiles up ON up.user_id = auth.uid()
      WHERE dti.id = daily_task_item_assignees.item_id
      AND dtl.company_id = up.company_id
      AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  );

-- RLS Policies for comments (everyone can comment)
ALTER TABLE public.daily_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their company"
  ON public.daily_task_comments FOR SELECT
  USING (
    (list_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.daily_task_lists
      WHERE id = daily_task_comments.list_id
      AND company_id = public.get_user_company_id()
    ))
    OR
    (item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.daily_task_items dti
      JOIN public.daily_task_lists dtl ON dtl.id = dti.list_id
      WHERE dti.id = daily_task_comments.item_id
      AND dtl.company_id = public.get_user_company_id()
    ))
  );

CREATE POLICY "Users can create comments"
  ON public.daily_task_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    (
      (list_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.daily_task_lists
        WHERE id = daily_task_comments.list_id
        AND company_id = public.get_user_company_id()
      ))
      OR
      (item_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.daily_task_items dti
        JOIN public.daily_task_lists dtl ON dtl.id = dti.list_id
        WHERE dti.id = daily_task_comments.item_id
        AND dtl.company_id = public.get_user_company_id()
      ))
    )
  );

CREATE POLICY "Users can update own comments"
  ON public.daily_task_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.daily_task_comments FOR DELETE
  USING (author_id = auth.uid());

-- RLS Policies for templates
ALTER TABLE public.daily_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates for their company"
  ON public.daily_task_templates FOR SELECT
  USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins/foremen can manage templates"
  ON public.daily_task_templates FOR ALL
  USING (
    company_id = public.get_user_company_id() AND
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  );

-- RLS Policies for activity log
ALTER TABLE public.daily_task_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity in their company"
  ON public.daily_task_activity_log FOR SELECT
  USING (
    (list_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.daily_task_lists
      WHERE id = daily_task_activity_log.list_id
      AND company_id = public.get_user_company_id()
    ))
    OR
    (item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.daily_task_items dti
      JOIN public.daily_task_lists dtl ON dtl.id = dti.list_id
      WHERE dti.id = daily_task_activity_log.item_id
      AND dtl.company_id = public.get_user_company_id()
    ))
  );

CREATE POLICY "System can insert activity"
  ON public.daily_task_activity_log FOR INSERT
  WITH CHECK (actor_id = auth.uid());