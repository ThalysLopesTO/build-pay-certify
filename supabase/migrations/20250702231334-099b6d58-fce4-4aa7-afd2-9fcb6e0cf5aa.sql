-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily notification checks to run at 9 AM every day
SELECT cron.schedule(
  'daily-notification-checks',
  '0 9 * * *', -- At 9:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/daily-notification-checks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWp3cGFqdmNtYWhvYW13d3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDM4NDcsImV4cCI6MjA2NDQ3OTg0N30.bmtRnTF2Jf36ukaLkBnhxs2X6u5fZxqyOyqkeZYmlNA"}'::jsonb,
        body:='{"source": "cron_job", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);