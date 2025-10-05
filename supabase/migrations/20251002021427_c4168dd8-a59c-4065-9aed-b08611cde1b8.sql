-- Enable real-time replication for timesheets table
ALTER TABLE public.timesheets REPLICA IDENTITY FULL;

-- Add timesheets table to the real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.timesheets;