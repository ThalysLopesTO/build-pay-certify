-- Add pinned field to daily_task_comments table if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_task_comments'
  ) THEN
    -- Add pinned column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'daily_task_comments' 
      AND column_name = 'pinned'
    ) THEN
      ALTER TABLE public.daily_task_comments 
      ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT false;
      
      CREATE INDEX IF NOT EXISTS idx_daily_task_comments_pinned 
      ON public.daily_task_comments(list_id, pinned) 
      WHERE pinned = true;
    END IF;
  ELSE
    -- Create daily_task_comments table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.daily_task_comments (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      list_id UUID NOT NULL REFERENCES public.daily_task_lists(id) ON DELETE CASCADE,
      item_id UUID REFERENCES public.daily_task_items(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      comment_text TEXT NOT NULL,
      pinned BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.daily_task_comments ENABLE ROW LEVEL SECURITY;

    -- RLS policies for comments
    CREATE POLICY "Users can view comments for their company's task lists"
      ON public.daily_task_comments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.daily_task_lists dtl
          INNER JOIN public.user_profiles up ON up.company_id = dtl.company_id
          WHERE dtl.id = daily_task_comments.list_id
          AND up.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can create comments for their company's task lists"
      ON public.daily_task_comments FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.daily_task_lists dtl
          INNER JOIN public.user_profiles up ON up.company_id = dtl.company_id
          WHERE dtl.id = daily_task_comments.list_id
          AND up.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can update their own comments"
      ON public.daily_task_comments FOR UPDATE
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own comments"
      ON public.daily_task_comments FOR DELETE
      USING (auth.uid() = user_id);

    -- Create index for pinned comments
    CREATE INDEX idx_daily_task_comments_list_id ON public.daily_task_comments(list_id);
    CREATE INDEX idx_daily_task_comments_pinned ON public.daily_task_comments(list_id, pinned) WHERE pinned = true;

    -- Create trigger for updated_at
    CREATE TRIGGER update_daily_task_comments_updated_at
      BEFORE UPDATE ON public.daily_task_comments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;