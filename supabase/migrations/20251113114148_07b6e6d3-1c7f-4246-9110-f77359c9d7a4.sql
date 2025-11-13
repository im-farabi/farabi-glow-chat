-- Create donations table to track user donations
CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_user_id text NOT NULL,
  donation_type text NOT NULL CHECK (donation_type IN ('mrbeast', 'crypto_ltc', 'crypto_btc', 'usdt')),
  amount text NOT NULL,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (donations)
CREATE POLICY "Allow public donation insert" 
ON public.donations 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient querying by date
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);