-- 🔔 СТВОРЕННЯ ТАБЛИЦІ PUSH-СПОВІЩЕНЬ
-- Таблиця для зберігання підписок на push-сповіщення

-- 1. Створення таблиці push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 📱 Дані підписки
    subscription JSONB NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    
    -- 🔧 Технічні дані
    p256dh TEXT,
    auth_key TEXT,
    user_agent TEXT,
    
    -- 📊 Метадані
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Створення таблиці user_preferences якщо не існує
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- 🔔 Налаштування сповіщень
    push_notifications_enabled BOOLEAN DEFAULT FALSE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE,
    sms_notifications_enabled BOOLEAN DEFAULT FALSE,
    
    -- 📱 Типи сповіщень
    notify_new_messages BOOLEAN DEFAULT TRUE,
    notify_listing_updates BOOLEAN DEFAULT TRUE,
    notify_price_changes BOOLEAN DEFAULT FALSE,
    notify_favorites BOOLEAN DEFAULT TRUE,
    notify_system_updates BOOLEAN DEFAULT TRUE,
    
    -- 🕐 Часові налаштування
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone VARCHAR(50) DEFAULT 'Europe/Kiev',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Додавання RLS (Row Level Security)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Дозволити користувачам керувати своїми підписками
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Дозволити користувачам керувати своїми налаштуваннями
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Дозволити адміністраторам читати підписки для відправки сповіщень
CREATE POLICY "Admins can read push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 4. Функція та тригер для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_push_subscriptions_updated_at();

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- 5. Функція для відправки push-сповіщень (заготовка)
CREATE OR REPLACE FUNCTION send_push_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_body TEXT,
  notification_url TEXT DEFAULT '/'
)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_record RECORD;
  notification_data JSONB;
BEGIN
  -- Формуємо дані сповіщення
  notification_data := jsonb_build_object(
    'title', notification_title,
    'body', notification_body,
    'url', notification_url,
    'timestamp', extract(epoch from now())
  );
  
  -- Знаходимо активні підписки користувача
  FOR subscription_record IN 
    SELECT * FROM push_subscriptions 
    WHERE user_id = target_user_id AND is_active = TRUE
  LOOP
    -- Тут буде логіка відправки через зовнішній сервіс
    -- Наприклад, через webhook або queue
    RAISE NOTICE 'Sending push notification to endpoint: %', subscription_record.endpoint;
  END LOOP;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to send push notification: %', SQLERRM;
    RETURN FALSE;
END;
$$ language 'plpgsql';

-- Надаємо права виконання
GRANT EXECUTE ON FUNCTION send_push_notification(UUID, TEXT, TEXT, TEXT) TO authenticated;

SELECT 'Таблиці push-сповіщень створені успішно! 🔔' as status;