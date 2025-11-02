-- Add 'urgent' priority level to daily_task_items
ALTER TABLE daily_task_items 
DROP CONSTRAINT IF EXISTS daily_task_items_priority_check;

ALTER TABLE daily_task_items 
ADD CONSTRAINT daily_task_items_priority_check 
CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]));

-- Create custom tags table
CREATE TABLE IF NOT EXISTS daily_task_item_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES daily_task_items(id) ON DELETE CASCADE,
  tag_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(item_id, tag_text)
);

-- Enable RLS
ALTER TABLE daily_task_item_tags ENABLE ROW LEVEL SECURITY;

-- Users can view tags in their company
CREATE POLICY "Users can view tags in their company"
  ON daily_task_item_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_task_items dti
      JOIN daily_task_lists dtl ON dtl.id = dti.list_id
      WHERE dti.id = daily_task_item_tags.item_id
      AND dtl.company_id = get_user_company_id()
    )
  );

-- Admins/foremen can manage tags
CREATE POLICY "Admins/foremen can manage tags"
  ON daily_task_item_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM daily_task_items dti
      JOIN daily_task_lists dtl ON dtl.id = dti.list_id
      JOIN user_profiles up ON up.user_id = auth.uid()
      WHERE dti.id = daily_task_item_tags.item_id
      AND dtl.company_id = up.company_id
      AND up.role IN ('admin', 'super_admin', 'management', 'foreman')
    )
  );

-- Index for performance
CREATE INDEX idx_daily_task_item_tags_item_id ON daily_task_item_tags(item_id);