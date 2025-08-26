-- Create tariff plans table for admin pricing management
CREATE TABLE public.tariff_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vip_listing', 'promo_listing', 'business_account')),
  price DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'UAH',
  duration_days INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tariff_plans
ALTER TABLE public.tariff_plans ENABLE ROW LEVEL SECURITY;

-- Policies for tariff_plans
CREATE POLICY "Anyone can view active tariff plans" 
ON public.tariff_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage tariff plans" 
ON public.tariff_plans 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create business verification requests table
CREATE TABLE public.business_verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  tax_id TEXT,
  website TEXT,
  description TEXT,
  documents JSONB, -- Store document URLs/metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on business_verification_requests
ALTER TABLE public.business_verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies for business verification requests
CREATE POLICY "Users can create own verification requests" 
ON public.business_verification_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own verification requests" 
ON public.business_verification_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending requests" 
ON public.business_verification_requests 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all verification requests" 
ON public.business_verification_requests 
FOR ALL 
USING (is_admin(auth.uid()));

-- Create user subscriptions table to track active tariffs
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tariff_plan_id UUID NOT NULL REFERENCES public.tariff_plans(id),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE, -- For listing-specific promotions
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  payment_amount DECIMAL NOT NULL,
  payment_currency TEXT NOT NULL DEFAULT 'UAH',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for user subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Add business account fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'regular' CHECK (account_type IN ('regular', 'business', 'premium')),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_badge TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT;

-- Update listings table for VIP and promo features
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vip_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promotion_type TEXT CHECK (promotion_type IN ('none', 'promoted', 'vip', 'featured')),
ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON public.user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_business_verification_requests_status ON public.business_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_listings_promotion ON public.listings(promotion_type, promoted_at) WHERE promotion_type IS NOT NULL;

-- Create function to check if user has active business subscription
CREATE OR REPLACE FUNCTION public.has_active_business_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_subscriptions us
    JOIN tariff_plans tp ON us.tariff_plan_id = tp.id
    WHERE us.user_id = user_uuid 
      AND tp.type = 'business_account'
      AND us.status = 'active'
      AND us.expires_at > now()
  );
$$;

-- Create function to update user account type based on subscriptions
CREATE OR REPLACE FUNCTION public.update_user_account_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update account type based on active business subscription
  UPDATE profiles 
  SET account_type = CASE 
    WHEN has_active_business_subscription(NEW.user_id) THEN 'business'
    ELSE 'regular'
  END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update account types
DROP TRIGGER IF EXISTS trigger_update_account_type ON public.user_subscriptions;
CREATE TRIGGER trigger_update_account_type
  AFTER INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_account_type();

-- Insert default tariff plans
INSERT INTO public.tariff_plans (name, type, price, duration_days, description) VALUES
('VIP Оголошення - 7 днів', 'vip_listing', 50, 7, 'Підняття оголошення в топ результатів пошуку на 7 днів'),
('VIP Оголошення - 14 днів', 'vip_listing', 90, 14, 'Підняття оголошення в топ результатів пошуку на 14 днів'),
('VIP Оголошення - 30 днів', 'vip_listing', 150, 30, 'Підняття оголошення в топ результатів пошуку на 30 днів'),
('Промо оголошення - 3 дні', 'promo_listing', 25, 3, 'Виділення оголошення кольором на 3 дні'),
('Промо оголошення - 7 днів', 'promo_listing', 45, 7, 'Виділення оголошення кольором на 7 днів'),
('Бізнес акаунт - місяць', 'business_account', 200, 30, 'Бізнес функції та верифікація на 1 місяць'),
('Бізнес акаунт - 3 місяці', 'business_account', 500, 90, 'Бізнес функції та верифікація на 3 місяці'),
('Бізнес акаунт - рік', 'business_account', 1800, 365, 'Бізнес функції та верифікація на рік');