-- Fix quote notification functions to make email sending non-blocking

-- Drop existing functions
DROP FUNCTION IF EXISTS send_quote_notification_email(uuid, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS approve_quote_public(text, text);
DROP FUNCTION IF EXISTS request_quote_changes_public(text, text);
DROP FUNCTION IF EXISTS decline_quote_public(text, text);

-- Recreate send_quote_notification_email with non-blocking error handling
CREATE OR REPLACE FUNCTION send_quote_notification_email(
  p_quote_id uuid,
  p_subject text,
  p_body_text text,
  p_client_name text,
  p_client_email text,
  p_quote_number text,
  p_admin_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id bigint;
  v_response_status int;
  v_response_body text;
BEGIN
  -- Attempt to send email notification (non-blocking)
  BEGIN
    SELECT INTO v_request_id, v_response_status, v_response_body
      (content->>'id')::bigint,
      status,
      content::text
    FROM extensions.http((
      'POST',
      'https://qsqjwpajvcmahoamwwww.supabase.co/functions/v1/send-email',
      ARRAY[
        extensions.http_header('Content-Type', 'application/json')
      ],
      'application/json',
      json_build_object(
        'to', p_admin_email,
        'subject', p_subject,
        'html', '<html><body><p>' || p_body_text || '</p></body></html>',
        'companyName', 'Quote System'
      )::text
    )::extensions.http_request);

    -- Log success
    IF v_response_status = 200 THEN
      RAISE NOTICE 'Email notification sent successfully for quote %', p_quote_number;
    ELSE
      RAISE WARNING 'Email notification failed with status % for quote %', v_response_status, p_quote_number;
    END IF;

  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE WARNING 'Failed to send email notification for quote %: %', p_quote_number, SQLERRM;
  END;
END;
$$;

-- Recreate approve_quote_public with non-blocking email
CREATE OR REPLACE FUNCTION approve_quote_public(p_token text, p_signed_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id uuid;
  v_quote_number text;
  v_client_name text;
  v_client_email text;
  v_company_id uuid;
  v_admin_email text;
BEGIN
  -- Find the quote by token
  SELECT id, quote_number, client_name, client_email, company_id
  INTO v_quote_id, v_quote_number, v_client_name, v_client_email, v_company_id
  FROM quotes
  WHERE public_token = p_token;

  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  -- Update quote status to approved
  UPDATE quotes
  SET 
    status = 'approved',
    public_status = 'approved',
    client_approved_at = now(),
    client_name_signed = p_signed_name,
    accepted_date = now(),
    updated_at = now()
  WHERE id = v_quote_id;

  -- Get admin email for notification
  SELECT company_email INTO v_admin_email
  FROM company_settings
  WHERE company_id = v_company_id
  LIMIT 1;

  -- Send notification email (non-blocking)
  IF v_admin_email IS NOT NULL THEN
    BEGIN
      PERFORM send_quote_notification_email(
        v_quote_id,
        'Quote Approved: ' || v_quote_number,
        'Quote ' || v_quote_number || ' has been approved by ' || v_client_name || ' (' || v_client_email || '). Signed by: ' || p_signed_name,
        v_client_name,
        v_client_email,
        v_quote_number,
        v_admin_email
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Email notification failed but quote was approved: %', SQLERRM;
    END;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Quote approved successfully',
    'quote_id', v_quote_id
  );
END;
$$;

-- Recreate request_quote_changes_public with non-blocking email
CREATE OR REPLACE FUNCTION request_quote_changes_public(p_token text, p_message text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id uuid;
  v_quote_number text;
  v_client_name text;
  v_client_email text;
  v_company_id uuid;
  v_admin_email text;
BEGIN
  -- Find the quote by token
  SELECT id, quote_number, client_name, client_email, company_id
  INTO v_quote_id, v_quote_number, v_client_name, v_client_email, v_company_id
  FROM quotes
  WHERE public_token = p_token;

  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  -- Update quote with change request
  UPDATE quotes
  SET 
    public_status = 'changes_requested',
    client_change_request = p_message,
    updated_at = now()
  WHERE id = v_quote_id;

  -- Get admin email for notification
  SELECT company_email INTO v_admin_email
  FROM company_settings
  WHERE company_id = v_company_id
  LIMIT 1;

  -- Send notification email (non-blocking)
  IF v_admin_email IS NOT NULL THEN
    BEGIN
      PERFORM send_quote_notification_email(
        v_quote_id,
        'Changes Requested: ' || v_quote_number,
        'Quote ' || v_quote_number || ' - ' || v_client_name || ' (' || v_client_email || ') has requested changes: ' || p_message,
        v_client_name,
        v_client_email,
        v_quote_number,
        v_admin_email
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Email notification failed but changes were recorded: %', SQLERRM;
    END;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Change request submitted successfully',
    'quote_id', v_quote_id
  );
END;
$$;

-- Recreate decline_quote_public with non-blocking email
CREATE OR REPLACE FUNCTION decline_quote_public(p_token text, p_reason text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id uuid;
  v_quote_number text;
  v_client_name text;
  v_client_email text;
  v_company_id uuid;
  v_admin_email text;
BEGIN
  -- Find the quote by token
  SELECT id, quote_number, client_name, client_email, company_id
  INTO v_quote_id, v_quote_number, v_client_name, v_client_email, v_company_id
  FROM quotes
  WHERE public_token = p_token;

  IF v_quote_id IS NULL THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  -- Update quote status to declined
  UPDATE quotes
  SET 
    status = 'declined',
    public_status = 'declined',
    client_declined_at = now(),
    client_decline_reason = p_reason,
    declined_date = now(),
    updated_at = now()
  WHERE id = v_quote_id;

  -- Get admin email for notification
  SELECT company_email INTO v_admin_email
  FROM company_settings
  WHERE company_id = v_company_id
  LIMIT 1;

  -- Send notification email (non-blocking)
  IF v_admin_email IS NOT NULL THEN
    BEGIN
      PERFORM send_quote_notification_email(
        v_quote_id,
        'Quote Declined: ' || v_quote_number,
        'Quote ' || v_quote_number || ' has been declined by ' || v_client_name || ' (' || v_client_email || '). Reason: ' || p_reason,
        v_client_name,
        v_client_email,
        v_quote_number,
        v_admin_email
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Email notification failed but quote was declined: %', SQLERRM;
    END;
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Quote declined',
    'quote_id', v_quote_id
  );
END;
$$;