
-- Drop existing RLS policies for user_profiles if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;

-- Create new RLS policies that allow registration
-- Allow users to view their own profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update their own profiles
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own profiles (for registration)
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all profiles (for admin operations and registration)
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Also ensure companies table allows insertion during registration
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Service role can manage all companies" ON public.companies;

-- Allow users to view companies they belong to
CREATE POLICY "Users can view their company" ON public.companies
  FOR SELECT 
  USING (
    id IN (
      SELECT company_id 
      FROM public.user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Allow service role to manage all companies (for registration and admin operations)
CREATE POLICY "Service role can manage all companies" ON public.companies
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Allow authenticated users to insert companies during registration
CREATE POLICY "Users can create companies during registration" ON public.companies
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
