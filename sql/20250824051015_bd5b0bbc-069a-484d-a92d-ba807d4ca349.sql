-- Исправляем функции, добавляя search_path для безопасности
CREATE OR REPLACE FUNCTION public.update_listing_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_like_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

-- Исправляем существующие функции
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_moderator(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('admin', 'moderator')
  );
END;
$$;