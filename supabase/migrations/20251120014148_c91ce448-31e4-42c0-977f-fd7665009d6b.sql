-- Link existing invoices to clients based on matching email addresses
UPDATE invoices i
SET client_id = c.id
FROM clients c
WHERE i.client_id IS NULL 
  AND i.client_email = c.client_email
  AND i.company_id = c.company_id;