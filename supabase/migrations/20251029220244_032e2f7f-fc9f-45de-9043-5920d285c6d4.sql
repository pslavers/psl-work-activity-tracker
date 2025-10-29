-- Create active_activities table to store currently running activities
CREATE TABLE IF NOT EXISTS public.active_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  project_id UUID,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  elapsed_time INTEGER NOT NULL DEFAULT 0,
  is_running BOOLEAN NOT NULL DEFAULT true,
  paused_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table for active activity tags
CREATE TABLE IF NOT EXISTS public.active_activity_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  active_activity_id UUID NOT NULL REFERENCES public.active_activities(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(active_activity_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.active_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_activity_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for active_activities
CREATE POLICY "Users can view their own active activities"
  ON public.active_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own active activities"
  ON public.active_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active activities"
  ON public.active_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own active activities"
  ON public.active_activities FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for active_activity_tags
CREATE POLICY "Users can view their own active activity tags"
  ON public.active_activity_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.active_activities
      WHERE active_activities.id = active_activity_tags.active_activity_id
      AND active_activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own active activity tags"
  ON public.active_activity_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.active_activities
      WHERE active_activities.id = active_activity_tags.active_activity_id
      AND active_activities.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own active activity tags"
  ON public.active_activity_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.active_activities
      WHERE active_activities.id = active_activity_tags.active_activity_id
      AND active_activities.user_id = auth.uid()
    )
  );

-- Add updated_at trigger for active_activities
CREATE TRIGGER update_active_activities_updated_at
  BEFORE UPDATE ON public.active_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for active_activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_activities;