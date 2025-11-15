-- Create portal_messages table for client communications
CREATE TABLE IF NOT EXISTS public.portal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  portal_token UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Company admins can view their messages
CREATE POLICY "Company admins can view their portal messages"
ON public.portal_messages
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_portal_messages_company_id ON public.portal_messages(company_id);
CREATE INDEX idx_portal_messages_client_id ON public.portal_messages(client_id);
CREATE INDEX idx_portal_messages_created_at ON public.portal_messages(created_at DESC);

-- Function to send a message from client portal
CREATE OR REPLACE FUNCTION public.send_portal_message(
  p_portal_token UUID,
  p_subject TEXT,
  p_message TEXT
)
RETURNS JSON AS $$
DECLARE
  v_client_record RECORD;
  v_message_id UUID;
BEGIN
  -- Get client info from portal token
  SELECT 
    c.id as client_id,
    c.company_id,
    c.client_name,
    c.client_email
  INTO v_client_record
  FROM clients c
  WHERE c.portal_token = p_portal_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid portal token');
  END IF;

  -- Insert message
  INSERT INTO portal_messages (
    company_id,
    client_id,
    portal_token,
    subject,
    message,
    client_name,
    client_email
  ) VALUES (
    v_client_record.company_id,
    v_client_record.client_id,
    p_portal_token,
    p_subject,
    p_message,
    v_client_record.client_name,
    v_client_record.client_email
  )
  RETURNING id INTO v_message_id;

  RETURN json_build_object(
    'success', true,
    'message_id', v_message_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;