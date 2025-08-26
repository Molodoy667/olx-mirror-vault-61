-- Fix security issues by setting search_path for security definer functions

-- Update existing function to fix search path
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data);
END;
$$;

-- Update existing trigger function to fix search path
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = now()
  WHERE (participant1_id = NEW.sender_id AND participant2_id = NEW.receiver_id)
     OR (participant1_id = NEW.receiver_id AND participant2_id = NEW.sender_id);
  RETURN NEW;
END;
$$;