-- Create user_credits table for tracking user balances
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance decimal(10,2) NOT NULL DEFAULT 5.00,
  total_spent decimal(10,2) NOT NULL DEFAULT 0.00,
  total_generations integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "Users can view own credits"
ON public.user_credits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);

-- Create webgen_history table for tracking generations
CREATE TABLE public.webgen_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  model text NOT NULL,
  cost decimal(10,2) NOT NULL,
  prompt text,
  success boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webgen_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view own history"
ON public.webgen_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_webgen_history_user_id ON public.webgen_history(user_id);

-- Function to create credits for new users (gives $5.00 free)
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (new.id, 5.00)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger on auth.users to auto-create credits for new users
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_credits();