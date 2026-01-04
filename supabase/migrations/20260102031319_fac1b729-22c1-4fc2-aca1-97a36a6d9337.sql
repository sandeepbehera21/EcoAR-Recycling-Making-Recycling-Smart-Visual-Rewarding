-- Create achievements table (static list of possible achievements)
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'total_scans', 'total_points', 'streak', 'waste_type_count'
  requirement_value INTEGER NOT NULL,
  requirement_waste_type TEXT, -- optional, for waste type specific achievements
  points_reward INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table (tracks unlocked achievements)
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create daily_challenges table
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'scan_count', 'waste_type', 'points'
  target_value INTEGER NOT NULL,
  target_waste_type TEXT, -- optional
  points_reward INTEGER NOT NULL,
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_challenge_progress table
CREATE TABLE public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by all authenticated users
CREATE POLICY "Achievements are viewable by authenticated users"
ON public.achievements FOR SELECT
TO authenticated
USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Daily challenges are readable by all authenticated users
CREATE POLICY "Daily challenges are viewable by authenticated users"
ON public.daily_challenges FOR SELECT
TO authenticated
USING (true);

-- User challenge progress policies
CREATE POLICY "Users can view their own challenge progress"
ON public.user_challenge_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress"
ON public.user_challenge_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
ON public.user_challenge_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Add last_scan_date to profiles for streak tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_scan_date DATE;

-- Create indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_daily_challenges_active_date ON public.daily_challenges(active_date);
CREATE INDEX idx_user_challenge_progress_user_id ON public.user_challenge_progress(user_id);