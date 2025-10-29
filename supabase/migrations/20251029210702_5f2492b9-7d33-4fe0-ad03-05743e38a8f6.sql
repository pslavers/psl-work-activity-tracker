-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  description TEXT NOT NULL,
  duration INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add trigger to activities table
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();