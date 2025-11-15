-- Drop existing function first
DROP FUNCTION IF EXISTS get_client_portal_data(uuid);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Client Information
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  client_address TEXT,
  
  -- Portal Access
  portal_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  
  -- Metadata
  total_quotes INTEGER DEFAULT 0,
  total_invoices INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_client_email_per_company UNIQUE(company_id, client_email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON clients(portal_token);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(client_email);

-- Add client_id to quotes (nullable for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'quotes' AND column_name = 'client_id') THEN
    ALTER TABLE quotes ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    CREATE INDEX idx_quotes_client_id ON quotes(client_id);
  END IF;
END $$;

-- Add client_id to invoices
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'invoices' AND column_name = 'client_id') THEN
    ALTER TABLE invoices ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
    CREATE INDEX idx_invoices_client_id ON invoices(client_id);
  END IF;
END $$;

-- Migrate existing quotes to clients table
INSERT INTO clients (company_id, client_name, client_company, client_email, client_phone, client_address)
SELECT DISTINCT 
  company_id,
  client_name,
  COALESCE(client_company, client_name),
  client_email,
  client_phone,
  client_address
FROM quotes
WHERE client_email IS NOT NULL
ON CONFLICT (company_id, client_email) DO NOTHING;

-- Update quotes with client_id
UPDATE quotes q
SET client_id = c.id
FROM clients c
WHERE q.client_email = c.client_email 
  AND q.company_id = c.company_id
  AND q.client_id IS NULL;

-- Migrate existing invoices to clients
INSERT INTO clients (company_id, client_name, client_company, client_email, client_phone, client_address)
SELECT DISTINCT 
  company_id,
  client_company AS client_name,
  client_company,
  client_email,
  client_phone,
  client_address
FROM invoices
WHERE client_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.client_email = invoices.client_email 
      AND c.company_id = invoices.company_id
  )
ON CONFLICT (company_id, client_email) DO NOTHING;

-- Update invoices with client_id
UPDATE invoices i
SET client_id = c.id
FROM clients c
WHERE i.client_email = c.client_email 
  AND i.company_id = c.company_id
  AND i.client_id IS NULL;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view clients in their company" ON clients;
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;

-- Admin/Management can see all clients in their company
CREATE POLICY "Users can view clients in their company"
ON clients FOR SELECT
TO authenticated
USING (company_id = get_user_company_id());

-- Admin/Management can manage clients
CREATE POLICY "Admins can manage clients"
ON clients FOR ALL
TO authenticated
USING (
  company_id = get_user_company_id() 
  AND user_has_admin_role()
)
WITH CHECK (
  company_id = get_user_company_id() 
  AND user_has_admin_role()
);

-- Function to get client portal data
CREATE OR REPLACE FUNCTION get_client_portal_data(p_portal_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_company_id UUID;
  v_result JSON;
BEGIN
  SELECT id, company_id INTO v_client_id, v_company_id
  FROM clients
  WHERE portal_token = p_portal_token;
  
  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;
  
  SELECT json_build_object(
    'client', (
      SELECT row_to_json(c)
      FROM clients c
      WHERE c.id = v_client_id
    ),
    'quotes', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', q.id,
          'quote_number', q.quote_number,
          'project_name', q.project_name,
          'quote_date', q.quote_date,
          'expiry_date', q.expiry_date,
          'status', q.status,
          'public_status', q.public_status,
          'total_amount', q.total_amount,
          'public_token', q.public_token,
          'notes', q.notes
        ) ORDER BY q.created_at DESC
      ), '[]'::json)
      FROM quotes q
      WHERE q.client_id = v_client_id
        AND q.status != 'draft'
    ),
    'invoices', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', i.id,
          'invoice_number', i.invoice_number,
          'title', i.title,
          'due_date', i.due_date,
          'status', i.status,
          'total_amount', i.total_amount,
          'sent_date', i.sent_date,
          'notes', i.notes
        ) ORDER BY i.created_at DESC
      ), '[]'::json)
      FROM invoices i
      WHERE i.client_id = v_client_id
    ),
    'company_settings', (
      SELECT json_build_object(
        'company_name', cs.company_name,
        'company_logo_url', cs.company_logo_url,
        'company_email', cs.company_email,
        'company_phone', cs.company_phone,
        'company_address', cs.company_address
      )
      FROM company_settings cs
      WHERE cs.company_id = v_company_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_client_portal_data(UUID) TO anon, authenticated;

-- Function to update client statistics
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'quotes' AND NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET 
      total_quotes = (SELECT COUNT(*) FROM quotes WHERE client_id = NEW.client_id),
      total_revenue = (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM quotes 
        WHERE client_id = NEW.client_id AND status = 'accepted'
      ) + (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM invoices 
        WHERE client_id = NEW.client_id AND status = 'paid'
      ),
      updated_at = now()
    WHERE id = NEW.client_id;
  END IF;
  
  IF TG_TABLE_NAME = 'invoices' AND NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET 
      total_invoices = (SELECT COUNT(*) FROM invoices WHERE client_id = NEW.client_id),
      total_revenue = (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM quotes 
        WHERE client_id = NEW.client_id AND status = 'accepted'
      ) + (
        SELECT COALESCE(SUM(total_amount), 0) 
        FROM invoices 
        WHERE client_id = NEW.client_id AND status = 'paid'
      ),
      updated_at = now()
    WHERE id = NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_client_stats_on_quote ON quotes;
DROP TRIGGER IF EXISTS update_client_stats_on_invoice ON invoices;

-- Create triggers
CREATE TRIGGER update_client_stats_on_quote
AFTER INSERT OR UPDATE ON quotes
FOR EACH ROW
WHEN (NEW.client_id IS NOT NULL)
EXECUTE FUNCTION update_client_stats();

CREATE TRIGGER update_client_stats_on_invoice
AFTER INSERT OR UPDATE ON invoices
FOR EACH ROW
WHEN (NEW.client_id IS NOT NULL)
EXECUTE FUNCTION update_client_stats();