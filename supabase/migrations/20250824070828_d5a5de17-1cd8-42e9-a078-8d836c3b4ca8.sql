-- Create chat conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  listing_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(participant1_id, participant2_id, listing_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user ratings table
CREATE TABLE public.user_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rated_user_id UUID NOT NULL,
  rater_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(rated_user_id, rater_user_id, transaction_id)
);

-- Create locations table for detailed location hierarchy
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_uk TEXT NOT NULL,
  type TEXT NOT NULL, -- country, region, city, district
  parent_id UUID REFERENCES public.locations(id),
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create business profiles table
CREATE TABLE public.business_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  description TEXT,
  website TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create price offers table
CREATE TABLE public.price_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  offered_price DECIMAL NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, counter_offered
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_offers ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can update their conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- User ratings policies
CREATE POLICY "Users can view all ratings" ON public.user_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create ratings" ON public.user_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_user_id AND rater_user_id != rated_user_id);

CREATE POLICY "Users can update own ratings" ON public.user_ratings
  FOR UPDATE USING (auth.uid() = rater_user_id);

-- Locations policies
CREATE POLICY "Locations are viewable by everyone" ON public.locations
  FOR SELECT USING (true);

-- Business profiles policies
CREATE POLICY "Business profiles are viewable by everyone" ON public.business_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create own business profile" ON public.business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business profile" ON public.business_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Price offers policies
CREATE POLICY "Users can view offers for their listings" ON public.price_offers
  FOR SELECT USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_id AND listings.user_id = auth.uid())
  );

CREATE POLICY "Users can create price offers" ON public.price_offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update offers" ON public.price_offers
  FOR UPDATE USING (auth.uid() = seller_id);

-- Insert some default locations
INSERT INTO public.locations (name, name_uk, type) VALUES
  ('Ukraine', 'Україна', 'country'),
  ('Kyiv Region', 'Київська область', 'region'),
  ('Kharkiv Region', 'Харківська область', 'region'),
  ('Dnipro Region', 'Дніпропетровська область', 'region'),
  ('Odesa Region', 'Одеська область', 'region'),
  ('Lviv Region', 'Львівська область', 'region');

-- Create trigger to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = now()
  WHERE (participant1_id = NEW.sender_id AND participant2_id = NEW.receiver_id)
     OR (participant1_id = NEW.receiver_id AND participant2_id = NEW.sender_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;