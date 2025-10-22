-- Add webhook configuration columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS webhook_events TEXT[] DEFAULT ARRAY['daily_summary']::TEXT[];

-- Add comments
COMMENT ON COLUMN companies.webhook_url IS 'External webhook endpoint URL for automation (e.g., n8n)';
COMMENT ON COLUMN companies.webhook_secret IS 'Secret key for HMAC signature verification';
COMMENT ON COLUMN companies.webhook_enabled IS 'Master toggle to enable/disable webhooks';
COMMENT ON COLUMN companies.webhook_events IS 'Array of event types to trigger webhooks for';

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'retrying')),
  http_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_company_id ON webhook_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_sent_at ON webhook_logs(sent_at DESC);

-- RLS Policies
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Company admins can view their webhook logs
CREATE POLICY "Company admins can view webhook logs"
  ON webhook_logs FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Service role can manage all webhook logs
CREATE POLICY "Service role can manage webhook logs"
  ON webhook_logs FOR ALL
  USING (auth.role() = 'service_role');