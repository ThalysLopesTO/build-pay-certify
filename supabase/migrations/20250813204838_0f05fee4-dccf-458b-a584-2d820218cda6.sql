-- Add work_note field to timesheets table
ALTER TABLE public.timesheets 
ADD COLUMN work_note text CHECK (char_length(work_note) <= 500);