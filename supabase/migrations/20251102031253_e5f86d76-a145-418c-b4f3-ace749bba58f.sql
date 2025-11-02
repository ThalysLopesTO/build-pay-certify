-- Drop all daily task tables and related objects
-- This will permanently delete all task data

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS daily_task_activity_log CASCADE;
DROP TABLE IF EXISTS daily_task_comments CASCADE;
DROP TABLE IF EXISTS daily_task_item_tags CASCADE;
DROP TABLE IF EXISTS daily_task_item_assignees CASCADE;
DROP TABLE IF EXISTS daily_task_items CASCADE;
DROP TABLE IF EXISTS daily_task_templates CASCADE;
DROP TABLE IF EXISTS daily_task_lists CASCADE;

-- Drop any remaining functions or triggers related to daily tasks
-- (The CASCADE will handle most of these, but we're being explicit)

COMMENT ON SCHEMA public IS 'Daily Tasks feature completely removed';