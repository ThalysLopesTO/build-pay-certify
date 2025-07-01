
-- Add a policy to allow system functions to insert notifications
-- This is needed because triggers run in the context of the user making the original insert
CREATE POLICY "Allow system to insert notifications for triggers" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (
    -- Allow inserts when they're triggered by legitimate user actions
    -- The trigger functions will handle the business logic
    auth.uid() IS NOT NULL
  );
