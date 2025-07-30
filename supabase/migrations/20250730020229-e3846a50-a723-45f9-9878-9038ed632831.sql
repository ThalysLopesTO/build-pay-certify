-- Update missed_punch_requests table to store times as text instead of timestamps
-- First, let's add new columns for the corrected times as text
ALTER TABLE public.missed_punch_requests 
ADD COLUMN corrected_time_in_text text,
ADD COLUMN corrected_time_out_text text;

-- Copy existing timestamp data to text format (time only)
UPDATE public.missed_punch_requests 
SET 
  corrected_time_in_text = CASE 
    WHEN corrected_time_in IS NOT NULL THEN to_char(corrected_time_in, 'HH24:MI')
    ELSE NULL 
  END,
  corrected_time_out_text = CASE 
    WHEN corrected_time_out IS NOT NULL THEN to_char(corrected_time_out, 'HH24:MI')
    ELSE NULL 
  END;

-- Drop the old timestamp columns
ALTER TABLE public.missed_punch_requests 
DROP COLUMN corrected_time_in,
DROP COLUMN corrected_time_out;

-- Rename the new text columns to the original names
ALTER TABLE public.missed_punch_requests 
RENAME COLUMN corrected_time_in_text TO corrected_time_in;

ALTER TABLE public.missed_punch_requests 
RENAME COLUMN corrected_time_out_text TO corrected_time_out;