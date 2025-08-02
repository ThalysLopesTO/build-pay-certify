-- Add latitude and longitude columns to jobsites table
ALTER TABLE public.jobsites 
ADD COLUMN latitude DECIMAL(9,6) NULL,
ADD COLUMN longitude DECIMAL(9,6) NULL;