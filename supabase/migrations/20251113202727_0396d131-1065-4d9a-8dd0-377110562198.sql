-- Enable http extension for calling edge functions from database
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create helper function to get admin emails for a company
CREATE OR REPLACE FUNCTION public.get_company_admin_emails(p_company_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails TEXT[];
BEGIN
  SELECT ARRAY_AGG(au.email)
  INTO admin_emails
  FROM user_profiles up
  INNER JOIN auth.users au ON au.id = up.user_id
  WHERE up.company_id = p_company_id
    AND up.role IN ('admin', 'super_admin', 'management')
    AND up.is_active = true;
  
  RETURN COALESCE(admin_emails, ARRAY[]::TEXT[]);
END;
$$;

-- Helper function to send email notification
CREATE OR REPLACE FUNCTION public.send_quote_notification_email(
  p_to_email TEXT,
  p_subject TEXT,
  p_html TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id BIGINT;
  v_response extensions.http_response;
BEGIN
  -- Call the send-email edge function
  SELECT INTO v_response * FROM extensions.http((
    'POST',
    'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email',
    ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))
    ],
    'application/json',
    jsonb_build_object(
      'to', p_to_email,
      'subject', p_subject,
      'html', p_html
    )::text
  )::extensions.http_request);
  
  -- Log if there was an error (but don't fail the transaction)
  IF v_response.status != 200 THEN
    RAISE WARNING 'Failed to send email to %: % %', p_to_email, v_response.status, v_response.content;
  END IF;
END;
$$;

-- Drop and recreate approve_quote_public with email notifications
DROP FUNCTION IF EXISTS public.approve_quote_public(text, text);

CREATE OR REPLACE FUNCTION public.approve_quote_public(
  p_token TEXT,
  p_signed_name TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record RECORD;
  company_record RECORD;
  admin_emails TEXT[];
  admin_email TEXT;
  email_subject TEXT;
  email_html TEXT;
  result json;
BEGIN
  -- Get quote data with correct status check
  SELECT q.*, cs.company_name
  INTO quote_record
  FROM public.quotes q
  LEFT JOIN public.company_settings cs ON cs.company_id = q.company_id
  WHERE q.public_token = p_token
    AND q.public_status = 'awaiting_response';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found or already processed'
    );
  END IF;
  
  -- Update quote to approved status
  UPDATE public.quotes
  SET 
    status = 'accepted',
    public_status = 'approved',
    client_approved_at = NOW(),
    client_name_signed = p_signed_name,
    accepted_date = NOW(),
    updated_at = NOW()
  WHERE id = quote_record.id;
  
  -- Get admin emails for notifications
  admin_emails := public.get_company_admin_emails(quote_record.company_id);
  
  -- Send email to each admin
  IF array_length(admin_emails, 1) > 0 THEN
    email_subject := '🎉 Quote #' || quote_record.quote_number || ' Approved by ' || quote_record.client_name;
    
    -- Build email HTML (inline to avoid dependency issues)
    email_html := '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif"><div style="max-width:600px;margin:40px auto;background-color:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden"><div style="text-align:center;padding:40px 20px;background:linear-gradient(135deg,#10b981 0%,#059669 100%)"><div style="font-size:48px;margin-bottom:10px">🎉</div><h1 style="color:#fff;font-size:28px;font-weight:700;margin:0">Quote Approved!</h1></div><div style="padding:40px 30px"><p style="font-size:16px;color:#1f2937;line-height:1.6;margin:0 0 20px 0">Great news! <strong>' || quote_record.client_name || '</strong> has approved the quote for <strong>' || quote_record.project_name || '</strong>.</p><div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin:30px 0;border-left:4px solid #10b981"><div style="display:table;width:100%;border-spacing:0"><div style="display:table-row"><div style="display:table-cell;padding:8px 0;color:#6b7280;font-size:14px">Quote Number:</div><div style="display:table-cell;padding:8px 0;text-align:right;color:#1f2937;font-weight:600;font-size:14px">' || quote_record.quote_number || '</div></div><div style="display:table-row"><div style="display:table-cell;padding:8px 0;color:#6b7280;font-size:14px">Project:</div><div style="display:table-cell;padding:8px 0;text-align:right;color:#1f2937;font-weight:600;font-size:14px">' || quote_record.project_name || '</div></div><div style="display:table-row"><div style="display:table-cell;padding:8px 0;color:#6b7280;font-size:14px">Total Amount:</div><div style="display:table-cell;padding:8px 0;text-align:right;color:#10b981;font-weight:700;font-size:18px">$' || quote_record.total_amount || '</div></div><div style="display:table-row"><div style="display:table-cell;padding:8px 0;color:#6b7280;font-size:14px">Signed By:</div><div style="display:table-cell;padding:8px 0;text-align:right;color:#1f2937;font-weight:600;font-size:14px">' || p_signed_name || '</div></div></div></div><div style="text-align:center;margin:30px 0"><a href="https://app.stackbuild.ca/admin/quotes-management?quote=' || quote_record.id || '" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 6px rgba(16,185,129,0.25)">📋 View Quote in Dashboard</a></div></div><div style="background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#9ca3af;margin:0">© ' || EXTRACT(YEAR FROM NOW()) || ' ' || COALESCE(quote_record.company_name, 'StackBuild') || '. All rights reserved.</p></div></div></body></html>';
    
    FOREACH admin_email IN ARRAY admin_emails
    LOOP
      BEGIN
        PERFORM public.send_quote_notification_email(admin_email, email_subject, email_html);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to send notification to %: %', admin_email, SQLERRM;
      END;
    END LOOP;
  END IF;
  
  result := json_build_object(
    'success', true,
    'message', 'Quote approved successfully',
    'quote_id', quote_record.id
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_quote_public(TEXT, TEXT) TO anon, authenticated;

-- Drop and recreate request_quote_changes_public with email notifications
DROP FUNCTION IF EXISTS public.request_quote_changes_public(text, text);

CREATE OR REPLACE FUNCTION public.request_quote_changes_public(
  p_token TEXT,
  p_message TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_record RECORD;
  company_record RECORD;
  admin_emails TEXT[];
  admin_email TEXT;
  email_subject TEXT;
  email_html TEXT;
  result json;
BEGIN
  -- Get quote data with correct status check
  SELECT q.*, cs.company_name
  INTO quote_record
  FROM public.quotes q
  LEFT JOIN public.company_settings cs ON cs.company_id = q.company_id
  WHERE q.public_token = p_token
    AND q.public_status = 'awaiting_response';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Quote not found or already processed'
    );
  END IF;
  
  -- Update quote to changes_requested status
  UPDATE public.quotes
  SET 
    public_status = 'changes_requested',
    client_change_request = p_message,
    updated_at = NOW()
  WHERE id = quote_record.id;
  
  -- Get admin emails for notifications
  admin_emails := public.get_company_admin_emails(quote_record.company_id);
  
  -- Send email to each admin
  IF array_length(admin_emails, 1) > 0 THEN
    email_subject := '💬 Quote #' || quote_record.quote_number || ' - Changes Requested by ' || quote_record.client_name;
    
    -- Build email HTML (inline to avoid dependency issues)
    email_html := '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif"><div style="max-width:600px;margin:40px auto;background-color:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden"><div style="text-align:center;padding:40px 20px;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%)"><div style="font-size:48px;margin-bottom:10px">💬</div><h1 style="color:#fff;font-size:28px;font-weight:700;margin:0">Quote Changes Requested</h1></div><div style="padding:40px 30px"><p style="font-size:16px;color:#1f2937;line-height:1.6;margin:0 0 20px 0"><strong>' || quote_record.client_name || '</strong> has requested changes to the quote for <strong>' || quote_record.project_name || '</strong>.</p><div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin:30px 0;border-left:4px solid #f59e0b"><div style="display:table;width:100%;border-spacing:0"><div style="display:table-row"><div style="display:table-cell;padding:8px 0;color:#6b7280;font-size:14px">Quote Number:</div><div style="display:table-cell;padding:8px 0;text-align:right;color:#1f2937;font-weight:600;font-size:14px">' || quote_record.quote_number || '</div></div><div style="display:table-row"><div style="display:table-cell;padding:8px 0;color:#6b7280;font-size:14px">Project:</div><div style="display:table-cell;padding:8px 0;text-align:right;color:#1f2937;font-weight:600;font-size:14px">' || quote_record.project_name || '</div></div><div style="display:table-row"><div style="display:table-cell;padding:8px 0;color:#6b7280;font-size:14px">Total Amount:</div><div style="display:table-cell;padding:8px 0;text-align:right;color:#f59e0b;font-weight:700;font-size:18px">$' || quote_record.total_amount || '</div></div></div></div><div style="background-color:#fffbeb;border-left:4px solid #f59e0b;padding:20px;margin:30px 0;border-radius:4px"><h3 style="font-size:14px;color:#92400e;font-weight:600;margin:0 0 10px 0">Client''s Feedback:</h3><p style="font-size:14px;color:#78350f;margin:0;line-height:1.6;white-space:pre-wrap">' || p_message || '</p></div><div style="text-align:center;margin:30px 0"><a href="https://app.stackbuild.ca/admin/quotes-management?quote=' || quote_record.id || '" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;box-shadow:0 4px 6px rgba(245,158,11,0.25)">📋 Review & Respond</a></div></div><div style="background-color:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb"><p style="font-size:12px;color:#9ca3af;margin:0">© ' || EXTRACT(YEAR FROM NOW()) || ' ' || COALESCE(quote_record.company_name, 'StackBuild') || '. All rights reserved.</p></div></div></body></html>';
    
    FOREACH admin_email IN ARRAY admin_emails
    LOOP
      BEGIN
        PERFORM public.send_quote_notification_email(admin_email, email_subject, email_html);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to send notification to %: %', admin_email, SQLERRM;
      END;
    END LOOP;
  END IF;
  
  result := json_build_object(
    'success', true,
    'message', 'Change request submitted successfully',
    'quote_id', quote_record.id
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_quote_changes_public(TEXT, TEXT) TO anon, authenticated;