-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.approve_quote_public(UUID, TEXT);
DROP FUNCTION IF EXISTS public.request_quote_changes_public(UUID, TEXT);

-- Create approve_quote_public with email notification
CREATE FUNCTION public.approve_quote_public(
  p_token UUID,
  p_signed_name TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote_id UUID;
  v_quote_number TEXT;
  v_project_name TEXT;
  v_client_name TEXT;
  v_client_email TEXT;
  v_total_amount DECIMAL(10,2);
  v_company_id UUID;
  v_creator_user_id UUID;
  v_creator_email TEXT;
  v_creator_name TEXT;
  v_company_name TEXT;
  v_company_logo TEXT;
  v_email_html TEXT;
  v_email_subject TEXT;
BEGIN
  -- Fetch quote details and verify token
  SELECT 
    q.id, 
    q.quote_number, 
    q.project_name,
    q.client_name,
    q.client_email,
    q.total_amount,
    q.company_id,
    q.created_by
  INTO 
    v_quote_id,
    v_quote_number,
    v_project_name,
    v_client_name,
    v_client_email,
    v_total_amount,
    v_company_id,
    v_creator_user_id
  FROM public.quotes q
  WHERE q.public_token = p_token
    AND q.status = 'sent';
  
  -- Validate quote exists
  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired quote token';
  END IF;
  
  -- Update quote status
  UPDATE public.quotes
  SET 
    status = 'accepted',
    public_status = 'approved',
    client_approved_at = NOW(),
    client_signature_name = p_signed_name,
    accepted_date = NOW(),
    updated_at = NOW()
  WHERE id = v_quote_id;
  
  -- Get quote creator's email and name
  SELECT 
    up.email,
    COALESCE(up.first_name || ' ' || up.last_name, up.email)
  INTO 
    v_creator_email,
    v_creator_name
  FROM public.user_profiles up
  WHERE up.user_id = v_creator_user_id;
  
  -- Get company details
  SELECT 
    cs.company_name,
    cs.company_logo
  INTO 
    v_company_name,
    v_company_logo
  FROM public.company_settings cs
  WHERE cs.company_id = v_company_id;
  
  -- Build email notification
  v_email_subject := '✅ Quote ' || v_quote_number || ' Approved by ' || v_client_name;
  
  v_email_html := '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="background-color:#f8f9fb; font-family: Arial, sans-serif; padding: 30px 16px; color: #333;">
  <div style="max-width: 640px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
    ' || CASE 
      WHEN v_company_logo IS NOT NULL THEN
        '<div style="text-align:center; margin-bottom:12px;">
          <img src="' || v_company_logo || '" alt="' || v_company_name || ' Logo" style="max-width: 160px; max-height: 60px;" />
        </div>'
      ELSE ''
    END || '
    <h2 style="text-align:center; margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #222;">
      ' || v_company_name || '
    </h2>
    <div style="background-color: #10b981; color: white; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 18px;">🎉 Quote Approved!</h1>
    </div>
    <div style="font-size: 15px; line-height: 1.6; color: #444;">
      <p style="margin: 0 0 14px 0;">Hi ' || v_creator_name || ',</p>
      <p style="margin: 0 0 14px 0;">
        Great news! <strong>' || v_client_name || '</strong> has approved quote <strong>' || v_quote_number || '</strong>.
      </p>
      <div style="background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0;"><strong>Quote Details:</strong></p>
        <p style="margin: 0 0 4px 0;">📄 Quote: ' || v_quote_number || '</p>
        <p style="margin: 0 0 4px 0;">🏗️ Project: ' || v_project_name || '</p>
        <p style="margin: 0 0 4px 0;">👤 Client: ' || v_client_name || '</p>
        <p style="margin: 0 0 4px 0;">✍️ Signed by: ' || p_signed_name || '</p>
        <p style="margin: 0 0 4px 0;">💰 Amount: $' || v_total_amount || '</p>
        <p style="margin: 0;">📧 Client Email: ' || v_client_email || '</p>
      </div>
      <p style="margin: 0 0 14px 0;">
        The client has digitally signed the quote and is ready to proceed. You can now follow up to schedule the work.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://app.stackbuild.ca/admin/quotes" 
           style="display:inline-block; background-color:#10b981; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600;">
          View Quote in Dashboard
        </a>
      </div>
    </div>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
    <footer style="font-size: 12px; color: #888; text-align: center;">
      <div style="font-size: 11px; color: #aaa;">
        This notification was sent by StackBuild for ' || v_company_name || '
      </div>
    </footer>
  </div>
</body>
</html>';
  
  -- Send email notification (continue even if fails)
  IF v_creator_email IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWp3cGFqdmNtYWhvYW13d3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDM4NDcsImV4cCI6MjA2NDQ3OTg0N30.bmtRnTF2Jf36ukaLkBnhxs2X6u5fZxqyOyqkeZYmlNA'
        ),
        body := jsonb_build_object(
          'to', v_creator_email,
          'subject', v_email_subject,
          'customHtml', v_email_html
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send approval email: %', SQLERRM;
    END;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Quote approved successfully',
    'quote_id', v_quote_id
  );
END;
$$;

-- Create request_quote_changes_public with email notification
CREATE FUNCTION public.request_quote_changes_public(
  p_token UUID,
  p_message TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote_id UUID;
  v_quote_number TEXT;
  v_project_name TEXT;
  v_client_name TEXT;
  v_client_email TEXT;
  v_company_id UUID;
  v_creator_user_id UUID;
  v_creator_email TEXT;
  v_creator_name TEXT;
  v_company_name TEXT;
  v_company_logo TEXT;
  v_email_html TEXT;
  v_email_subject TEXT;
BEGIN
  -- Fetch quote details and verify token
  SELECT 
    q.id, 
    q.quote_number, 
    q.project_name,
    q.client_name,
    q.client_email,
    q.company_id,
    q.created_by
  INTO 
    v_quote_id,
    v_quote_number,
    v_project_name,
    v_client_name,
    v_client_email,
    v_company_id,
    v_creator_user_id
  FROM public.quotes q
  WHERE q.public_token = p_token
    AND q.status = 'sent';
  
  -- Validate quote exists
  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired quote token';
  END IF;
  
  -- Update quote status
  UPDATE public.quotes
  SET 
    public_status = 'changes_requested',
    client_change_request = p_message,
    client_change_requested_at = NOW(),
    updated_at = NOW()
  WHERE id = v_quote_id;
  
  -- Get quote creator's email and name
  SELECT 
    up.email,
    COALESCE(up.first_name || ' ' || up.last_name, up.email)
  INTO 
    v_creator_email,
    v_creator_name
  FROM public.user_profiles up
  WHERE up.user_id = v_creator_user_id;
  
  -- Get company details
  SELECT 
    cs.company_name,
    cs.company_logo
  INTO 
    v_company_name,
    v_company_logo
  FROM public.company_settings cs
  WHERE cs.company_id = v_company_id;
  
  -- Build email notification
  v_email_subject := '💬 Quote ' || v_quote_number || ' - Changes Requested by ' || v_client_name;
  
  v_email_html := '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="background-color:#f8f9fb; font-family: Arial, sans-serif; padding: 30px 16px; color: #333;">
  <div style="max-width: 640px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
    ' || CASE 
      WHEN v_company_logo IS NOT NULL THEN
        '<div style="text-align:center; margin-bottom:12px;">
          <img src="' || v_company_logo || '" alt="' || v_company_name || ' Logo" style="max-width: 160px; max-height: 60px;" />
        </div>'
      ELSE ''
    END || '
    <h2 style="text-align:center; margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #222;">
      ' || v_company_name || '
    </h2>
    <div style="background-color: #3b82f6; color: white; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 18px;">💬 Changes Requested</h1>
    </div>
    <div style="font-size: 15px; line-height: 1.6; color: #444;">
      <p style="margin: 0 0 14px 0;">Hi ' || v_creator_name || ',</p>
      <p style="margin: 0 0 14px 0;">
        <strong>' || v_client_name || '</strong> has reviewed quote <strong>' || v_quote_number || '</strong> and requested some changes.
      </p>
      <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0;"><strong>Quote Details:</strong></p>
        <p style="margin: 0 0 4px 0;">📄 Quote: ' || v_quote_number || '</p>
        <p style="margin: 0 0 4px 0;">🏗️ Project: ' || v_project_name || '</p>
        <p style="margin: 0 0 4px 0;">👤 Client: ' || v_client_name || '</p>
        <p style="margin: 0;">📧 Client Email: ' || v_client_email || '</p>
      </div>
      <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">Client''s Message:</p>
        <p style="margin: 0; color: #78350f; white-space: pre-wrap;">' || REPLACE(p_message, '''', '''''') || '</p>
      </div>
      <p style="margin: 0 0 14px 0;">
        Please review the client''s request and follow up to discuss the changes.
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://app.stackbuild.ca/admin/quotes" 
           style="display:inline-block; background-color:#3b82f6; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600;">
          View Quote in Dashboard
        </a>
      </div>
    </div>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
    <footer style="font-size: 12px; color: #888; text-align: center;">
      <div style="font-size: 11px; color: #aaa;">
        This notification was sent by StackBuild for ' || v_company_name || '
      </div>
    </footer>
  </div>
</body>
</html>';
  
  -- Send email notification (continue even if fails)
  IF v_creator_email IS NOT NULL THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWp3cGFqdmNtYWhvYW13d3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5MDM4NDcsImV4cCI6MjA2NDQ3OTg0N30.bmtRnTF2Jf36ukaLkBnhxs2X6u5fZxqyOyqkeZYmlNA'
        ),
        body := jsonb_build_object(
          'to', v_creator_email,
          'subject', v_email_subject,
          'customHtml', v_email_html
        )
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to send change request email: %', SQLERRM;
    END;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Change request submitted successfully',
    'quote_id', v_quote_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_quote_public(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_quote_changes_public(UUID, TEXT) TO anon, authenticated;