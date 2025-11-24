-- Add PRIMARY KEY to jobsites table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'jobsites_pkey' AND table_name = 'jobsites'
  ) THEN
    ALTER TABLE public.jobsites
    ADD CONSTRAINT jobsites_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Add UNIQUE constraint to user_profiles.user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_unique' AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Add PRIMARY KEY to jobsite_foremen if it doesn't have one
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'jobsite_foremen_pkey' AND table_name = 'jobsite_foremen'
  ) THEN
    ALTER TABLE public.jobsite_foremen
    ADD CONSTRAINT jobsite_foremen_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Add foreign key from jobsite_foremen.jobsite_id to jobsites.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'jobsite_foremen_jobsite_id_fkey' AND table_name = 'jobsite_foremen'
  ) THEN
    ALTER TABLE public.jobsite_foremen
    ADD CONSTRAINT jobsite_foremen_jobsite_id_fkey
    FOREIGN KEY (jobsite_id)
    REFERENCES public.jobsites(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from jobsite_foremen.foreman_id to user_profiles.user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'jobsite_foremen_foreman_id_fkey' AND table_name = 'jobsite_foremen'
  ) THEN
    ALTER TABLE public.jobsite_foremen
    ADD CONSTRAINT jobsite_foremen_foreman_id_fkey
    FOREIGN KEY (foreman_id)
    REFERENCES public.user_profiles(user_id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobsite_foremen_jobsite_id 
ON public.jobsite_foremen(jobsite_id);

CREATE INDEX IF NOT EXISTS idx_jobsite_foremen_foreman_id 
ON public.jobsite_foremen(foreman_id);

-- Add comment explaining the relationships
COMMENT ON CONSTRAINT jobsite_foremen_foreman_id_fkey ON public.jobsite_foremen 
IS 'Links foreman assignments to user profiles via user_id (auth user ID)';