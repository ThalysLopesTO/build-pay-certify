-- ============================================
-- COMPREHENSIVE TASKS SYSTEM FOR JOBSITES
-- Phase 1: Database Schema
-- ============================================

-- 1. TASKS TABLE (Main tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobsite_id UUID NOT NULL REFERENCES public.jobsites(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  trade TEXT,
  due_time TIME,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'done')) DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TASK ASSIGNEES (Many-to-many: tasks <-> users)
CREATE TABLE IF NOT EXISTS public.task_assignees (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- 3. TASK TAGS (Global tag library per company)
CREATE TABLE IF NOT EXISTS public.task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, label)
);

-- 4. TASK TAG LINKS (Many-to-many: tasks <-> tags)
CREATE TABLE IF NOT EXISTS public.task_tag_links (
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.task_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, tag_id)
);

-- 5. SUBTASKS TABLE
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  due_time TIME,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'done')) DEFAULT 'pending',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUBTASK ASSIGNEES (Many-to-many: subtasks <-> users)
CREATE TABLE IF NOT EXISTS public.subtask_assignees (
  subtask_id UUID NOT NULL REFERENCES public.subtasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (subtask_id, user_id)
);

-- 7. SUBTASK TAG LINKS (Many-to-many: subtasks <-> tags)
CREATE TABLE IF NOT EXISTS public.subtask_tag_links (
  subtask_id UUID NOT NULL REFERENCES public.subtasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.task_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (subtask_id, tag_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_jobsite_date ON public.tasks(jobsite_id, task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_company_date ON public.tasks(company_id, task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON public.task_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtask_assignees_user ON public.subtask_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_task_tag_links_tag ON public.task_tag_links(tag_id);
CREATE INDEX IF NOT EXISTS idx_subtask_tag_links_tag ON public.subtask_tag_links(tag_id);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Trigger function for updating tasks.updated_at
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for updating subtasks.updated_at
CREATE OR REPLACE FUNCTION update_subtasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ATTACH TRIGGERS
-- ============================================

CREATE TRIGGER tasks_updated_at_trigger
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION update_tasks_updated_at();

CREATE TRIGGER subtasks_updated_at_trigger
BEFORE UPDATE ON public.subtasks
FOR EACH ROW
EXECUTE FUNCTION update_subtasks_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tag_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtask_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtask_tag_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TASKS TABLE POLICIES
-- ============================================

-- Policy: Users can view tasks for their company
CREATE POLICY "Users can view tasks for their company"
ON public.tasks FOR SELECT
TO authenticated
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins and foremen can create tasks
CREATE POLICY "Admins and foremen can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND created_by = auth.uid()
  AND (
    SELECT role 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) IN ('admin', 'super_admin', 'management', 'foreman')
);

-- Policy: Admins and foremen can update all tasks
CREATE POLICY "Admins and foremen can update all tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND (
    SELECT role 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) IN ('admin', 'super_admin', 'management', 'foreman')
);

-- Policy: Employees can update tasks they're assigned to (status only)
CREATE POLICY "Employees can update assigned tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 
    FROM public.task_assignees 
    WHERE task_id = tasks.id 
    AND user_id = auth.uid()
  )
);

-- Policy: Admins and foremen can delete tasks
CREATE POLICY "Admins and foremen can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND (
    SELECT role 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) IN ('admin', 'super_admin', 'management', 'foreman')
);

-- ============================================
-- TASK ASSIGNEES POLICIES
-- ============================================

-- Policy: Users can view assignees for accessible tasks
CREATE POLICY "Users can view task assignees"
ON public.task_assignees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tasks 
    WHERE tasks.id = task_assignees.task_id 
    AND tasks.company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Admins and foremen can manage assignees
CREATE POLICY "Admins and foremen can manage assignees"
ON public.task_assignees FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE t.id = task_assignees.task_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE t.id = task_assignees.task_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- ============================================
-- TASK TAGS POLICIES
-- ============================================

-- Policy: Users can view tags for their company
CREATE POLICY "Users can view company tags"
ON public.task_tags FOR SELECT
TO authenticated
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can create tags for their company
CREATE POLICY "Users can create company tags"
ON public.task_tags FOR INSERT
TO authenticated
WITH CHECK (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can manage tags
CREATE POLICY "Admins can manage tags"
ON public.task_tags FOR ALL
TO authenticated
USING (
  company_id = (
    SELECT company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  )
  AND (
    SELECT role 
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
  ) IN ('admin', 'super_admin', 'management')
);

-- ============================================
-- TASK TAG LINKS POLICIES
-- ============================================

-- Policy: Users can view tag links for accessible tasks
CREATE POLICY "Users can view task tag links"
ON public.task_tag_links FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tasks 
    WHERE tasks.id = task_tag_links.task_id 
    AND tasks.company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Admins and foremen can manage tag links
CREATE POLICY "Admins and foremen can manage tag links"
ON public.task_tag_links FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE t.id = task_tag_links.task_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE t.id = task_tag_links.task_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- ============================================
-- SUBTASKS POLICIES
-- ============================================

-- Policy: Users can view subtasks for accessible tasks
CREATE POLICY "Users can view subtasks"
ON public.subtasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tasks 
    WHERE tasks.id = subtasks.task_id 
    AND tasks.company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Admins and foremen can manage subtasks
CREATE POLICY "Admins and foremen can manage subtasks"
ON public.subtasks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE t.id = subtasks.task_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE t.id = subtasks.task_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- Policy: Employees can update subtasks they're assigned to
CREATE POLICY "Employees can update assigned subtasks"
ON public.subtasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    WHERE t.id = subtasks.task_id 
    AND t.company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  )
  AND EXISTS (
    SELECT 1 
    FROM public.subtask_assignees 
    WHERE subtask_id = subtasks.id 
    AND user_id = auth.uid()
  )
);

-- ============================================
-- SUBTASK ASSIGNEES POLICIES
-- ============================================

-- Policy: Users can view subtask assignees
CREATE POLICY "Users can view subtask assignees"
ON public.subtask_assignees FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.subtasks s
    JOIN public.tasks t ON t.id = s.task_id
    WHERE s.id = subtask_assignees.subtask_id 
    AND t.company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Admins and foremen can manage subtask assignees
CREATE POLICY "Admins and foremen can manage subtask assignees"
ON public.subtask_assignees FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.subtasks s
    JOIN public.tasks t ON t.id = s.task_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE s.id = subtask_assignees.subtask_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.subtasks s
    JOIN public.tasks t ON t.id = s.task_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE s.id = subtask_assignees.subtask_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);

-- ============================================
-- SUBTASK TAG LINKS POLICIES
-- ============================================

-- Policy: Users can view subtask tag links
CREATE POLICY "Users can view subtask tag links"
ON public.subtask_tag_links FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.subtasks s
    JOIN public.tasks t ON t.id = s.task_id
    WHERE s.id = subtask_tag_links.subtask_id 
    AND t.company_id = (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Admins and foremen can manage subtask tag links
CREATE POLICY "Admins and foremen can manage subtask tag links"
ON public.subtask_tag_links FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.subtasks s
    JOIN public.tasks t ON t.id = s.task_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE s.id = subtask_tag_links.subtask_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.subtasks s
    JOIN public.tasks t ON t.id = s.task_id
    JOIN public.user_profiles up ON up.user_id = auth.uid()
    WHERE s.id = subtask_tag_links.subtask_id 
    AND t.company_id = up.company_id
    AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
  )
);