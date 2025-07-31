-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run send-reminders function daily at 9:00 AM EST
-- Note: This uses UTC time, so 9 AM EST = 2 PM UTC (accounting for daylight saving time)
SELECT cron.schedule(
  'daily-reminder-system',
  '0 14 * * *', -- Run at 2 PM UTC (9 AM EST)
  $$
  SELECT
    net.http_post(
        url:='https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWp3cGFqdmNtYWhvYW13d3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDM4NDcsImV4cCI6MjA2NDQ3OTg0N30.bmtRnTF2Jf36ukaLkBnhxs2X6u5fZxqyOyqkeZYmlNA"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);