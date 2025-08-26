-- Добавляем новые поля в таблицу listings для улучшения функционала
ALTER TABLE public.listings 
ADD COLUMN condition TEXT CHECK (condition IN ('new', 'used', 'refurbished')) DEFAULT 'used',
ADD COLUMN delivery_options TEXT[] DEFAULT ARRAY['pickup'],
ADD COLUMN contact_phone TEXT,
ADD COLUMN contact_preferred TEXT CHECK (contact_preferred IN ('phone', 'chat', 'both')) DEFAULT 'both',
ADD COLUMN business_listing BOOLEAN DEFAULT FALSE,
ADD COLUMN featured_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN boost_count INTEGER DEFAULT 0,
ADD COLUMN auto_repost BOOLEAN DEFAULT FALSE,
ADD COLUMN negotiable BOOLEAN DEFAULT TRUE;

-- Создаем таблицу для лайков/обзоров листингов
CREATE TABLE public.listing_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    listing_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, listing_id)
);

-- Создаем таблицу для счетчиков просмотров
CREATE TABLE public.listing_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID NOT NULL UNIQUE,
    views_today INTEGER DEFAULT 0,
    views_week INTEGER DEFAULT 0,
    views_total INTEGER DEFAULT 0,
    likes_total INTEGER DEFAULT 0,
    contacts_total INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаем таблицу для контактов/звонков
CREATE TABLE public.listing_contacts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID NOT NULL,
    contacted_by UUID,
    contact_type TEXT CHECK (contact_type IN ('phone', 'chat', 'view_phone')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_contacts ENABLE ROW LEVEL SECURITY;

-- Политики для лайков
CREATE POLICY "Users can manage own likes" 
ON public.listing_likes 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by listing owners" 
ON public.listing_likes 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = listing_likes.listing_id 
        AND listings.user_id = auth.uid()
    ) OR auth.uid() = user_id
);

-- Политики для статистики
CREATE POLICY "Listing stats viewable by owners" 
ON public.listing_stats 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = listing_stats.listing_id 
        AND listings.user_id = auth.uid()
    )
);

-- Политики для контактов
CREATE POLICY "Users can add contacts" 
ON public.listing_contacts 
FOR INSERT 
WITH CHECK (auth.uid() = contacted_by);

CREATE POLICY "Listing owners can view contacts" 
ON public.listing_contacts 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = listing_contacts.listing_id 
        AND listings.user_id = auth.uid()
    )
);

-- Функция для обновления статистики просмотров
CREATE OR REPLACE FUNCTION public.update_listing_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем счетчики просмотров
    INSERT INTO public.listing_stats (listing_id, views_today, views_week, views_total)
    VALUES (NEW.listing_id, 1, 1, 1)
    ON CONFLICT (listing_id) 
    DO UPDATE SET 
        views_today = listing_stats.views_today + 1,
        views_week = listing_stats.views_week + 1,
        views_total = listing_stats.views_total + 1,
        updated_at = now();
    
    -- Обновляем счетчик в основной таблице listings
    UPDATE public.listings 
    SET views = views + 1 
    WHERE id = NEW.listing_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического обновления статистики
CREATE TRIGGER update_listing_stats_trigger
    AFTER INSERT ON public.listing_views
    FOR EACH ROW
    EXECUTE FUNCTION public.update_listing_stats();

-- Функция для обновления лайков
CREATE OR REPLACE FUNCTION public.update_like_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Увеличиваем счетчик лайков
        INSERT INTO public.listing_stats (listing_id, likes_total)
        VALUES (NEW.listing_id, 1)
        ON CONFLICT (listing_id) 
        DO UPDATE SET 
            likes_total = listing_stats.likes_total + 1,
            updated_at = now();
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Уменьшаем счетчик лайков
        UPDATE public.listing_stats 
        SET 
            likes_total = GREATEST(0, likes_total - 1),
            updated_at = now()
        WHERE listing_id = OLD.listing_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для лайков
CREATE TRIGGER update_like_stats_trigger
    AFTER INSERT OR DELETE ON public.listing_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_like_stats();