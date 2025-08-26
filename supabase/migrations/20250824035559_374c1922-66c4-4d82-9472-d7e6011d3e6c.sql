-- Создание таблицы сохраненных поисков
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT,
  category_id UUID REFERENCES public.categories(id),
  location TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  condition TEXT,
  only_with_photo BOOLEAN DEFAULT FALSE,
  only_promoted BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включить RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "Users can view own saved searches" 
ON public.saved_searches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved searches" 
ON public.saved_searches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches" 
ON public.saved_searches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches" 
ON public.saved_searches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Триггер для обновления updated_at
CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Индексы для производительности
CREATE INDEX idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_notifications ON public.saved_searches(notifications_enabled, last_notification_sent) WHERE notifications_enabled = true;