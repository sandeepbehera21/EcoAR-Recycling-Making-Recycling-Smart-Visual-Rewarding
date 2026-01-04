-- Create scan_history table
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  waste_type TEXT NOT NULL,
  item_description TEXT,
  confidence INTEGER,
  points_earned INTEGER NOT NULL DEFAULT 0,
  tip TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own scan history
CREATE POLICY "Users can view their own scan history"
ON public.scan_history FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own scan history
CREATE POLICY "Users can insert their own scan history"
ON public.scan_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all scan history
CREATE POLICY "Admins can view all scan history"
ON public.scan_history FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_scan_history_user_id ON public.scan_history(user_id);
CREATE INDEX idx_scan_history_created_at ON public.scan_history(created_at DESC);