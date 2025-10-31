-- Add column to track companies created by super admin
ALTER TABLE companies 
ADD COLUMN created_by_super_admin boolean DEFAULT false;

-- Update existing free companies to be marked as super admin created if they have no stripe data
UPDATE companies 
SET created_by_super_admin = true 
WHERE plan = 'free' 
  AND stripe_customer_id IS NULL 
  AND stripe_subscription_id IS NULL;