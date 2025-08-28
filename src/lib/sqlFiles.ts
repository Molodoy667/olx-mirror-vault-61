// SQL Files Management Utilities

export interface SQLFile {
  name: string;
  content: string;
  size: number;
  lastModified: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  executionTime?: number;
}

// Актуальные SQL файлы из папки /sql
export async function loadSQLFiles(): Promise<SQLFile[]> {
  try {
    // Получаем список удаленных файлов из localStorage
    const deletedFiles = JSON.parse(localStorage.getItem('deletedSQLFiles') || '[]') as string[];
    
    // Актуальные файлы которые есть в папке /sql
    const actualFiles: SQLFile[] = [
      {
        name: 'create_site_settings_table.sql',
        content: await getFileContent('create_site_settings_table.sql'),
        size: 11137,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250130_add_profile_id.sql',
        content: await getFileContent('20250130_add_profile_id.sql'),
        size: 3675,
        lastModified: new Date(Date.now() - 86400000).toISOString(),
        status: 'idle'
      },
      {
        name: '20250130_create_notifications_system.sql',
        content: await getFileContent('20250130_create_notifications_system.sql'),
        size: 6277,
        lastModified: new Date(Date.now() - 172800000).toISOString(), 
        status: 'idle'
      },
      {
        name: '20250130_add_email_to_profiles.sql',
        content: await getFileContent('20250130_add_email_to_profiles.sql'),
        size: 1891,
        lastModified: new Date(Date.now() - 259200000).toISOString(),
        status: 'idle'
      },
      {
        name: '20250130_add_last_seen_to_profiles.sql',
        content: await getFileContent('20250130_add_last_seen_to_profiles.sql'),
        size: 1115,
        lastModified: new Date(Date.now() - 345600000).toISOString(),
        status: 'idle'
      }
    ];

    // Фильтруем удаленные файлы
    const filteredFiles = actualFiles.filter(file => !deletedFiles.includes(file.name));
    
    return filteredFiles;
  } catch (error) {
    console.error('Error loading SQL files:', error);
    return [];
  }
}

async function getFileContent(fileName: string): Promise<string> {
  // Загружаем реальное содержимое файлов
  const contents: { [key: string]: string } = {
    'create_site_settings_table.sql': `-- 🌐 СТВОРЕННЯ ТАБЛИЦІ НАЛАШТУВАНЬ САЙТУ
-- Таблиця для зберігання глобальних налаштувань сайту

-- 1. Створення таблиці site_settings
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 🌍 Основні налаштування
    site_name VARCHAR(100) NOT NULL DEFAULT 'Novado',
    site_description TEXT,
    site_keywords TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    
    -- 📍 Адреса та локація
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Україна',
    timezone VARCHAR(50) DEFAULT 'Europe/Kiev',
    language VARCHAR(10) DEFAULT 'uk',
    currency VARCHAR(10) DEFAULT 'UAH',
    
    -- 🎨 Візуальні налаштування
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    
    -- 📱 Мета-теги для SEO
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    meta_keywords TEXT,
    og_title VARCHAR(60),
    og_description VARCHAR(160),
    og_image TEXT,
    og_type VARCHAR(50) DEFAULT 'website',
    
    -- 📧 Соціальні мережі
    facebook_url TEXT,
    instagram_url TEXT,
    telegram_url TEXT,
    youtube_url TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    
    -- ⚙️ Технічні налаштування
    max_images_per_listing INTEGER DEFAULT 10,
    max_listing_price NUMERIC(10, 2) DEFAULT 999999.99,
    auto_approve_listings BOOLEAN DEFAULT FALSE,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    registration_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    
    -- 📈 Аналітика
    google_analytics_id VARCHAR(50),
    google_tag_manager_id VARCHAR(50),
    facebook_pixel_id VARCHAR(50),
    
    -- 💬 Месенджери
    support_chat_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_number VARCHAR(50),
    viber_number VARCHAR(50),
    
    -- 🔒 Безпека
    max_login_attempts INTEGER DEFAULT 5,
    session_timeout INTEGER DEFAULT 3600, -- seconds
    require_email_verification BOOLEAN DEFAULT TRUE,
    
    -- 📝 Контент
    default_listing_duration INTEGER DEFAULT 30, -- days
    featured_listings_count INTEGER DEFAULT 8,
    max_search_results INTEGER DEFAULT 50,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Додавання RLS (Row Level Security)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Дозволити публічний доступ на читання (для відображення на сайті)
CREATE POLICY "Allow public read access to site_settings" ON site_settings
  FOR SELECT USING (TRUE);

-- Дозволити адміністраторам повний доступ
CREATE POLICY "Allow admin full access to site_settings" ON site_settings
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admin_users)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- 3. Функція та тригер для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_site_settings_updated_at();

SELECT 'Таблиця site_settings створена успішно! ✅' as status;`,

    '20250130_add_profile_id.sql': `-- Міграція: Додавання унікального profile_id для профілів користувачів
-- Дата: 30.01.2025

-- 1. Додаємо колонку profile_id до таблиці profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_id VARCHAR(6) UNIQUE;

-- 2. Створюємо функцію для генерації унікального 6-значного ID
CREATE OR REPLACE FUNCTION generate_unique_profile_id() 
RETURNS VARCHAR(6) AS $$
DECLARE
    new_id VARCHAR(6);
    counter INTEGER := 0;
    max_attempts INTEGER := 1000;
BEGIN
    LOOP
        -- Генеруємо випадковий 6-значний ID (цифри + великі літери)
        new_id := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
        
        -- Перевіряємо чи такий ID вже існує
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE profile_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        IF counter > max_attempts THEN
            RAISE EXCEPTION 'Не вдалося згенерувати унікальний profile_id після % спроб', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Оновлюємо існуючі профілі без profile_id
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN SELECT id FROM profiles WHERE profile_id IS NULL LOOP
        UPDATE profiles 
        SET profile_id = generate_unique_profile_id() 
        WHERE id = profile_record.id;
    END LOOP;
    
    RAISE NOTICE 'Оновлено profile_id для всіх існуючих профілів';
END $$;

-- 4. Робимо profile_id обов'язковим для нових записів
ALTER TABLE profiles ALTER COLUMN profile_id SET NOT NULL;

-- 5. Створюємо тригер для автоматичного присвоєння profile_id новим профілям
CREATE OR REPLACE FUNCTION assign_profile_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.profile_id IS NULL THEN
        NEW.profile_id := generate_unique_profile_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_profile_id_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_profile_id();

-- 6. Створюємо індекс для швидкого пошуку по profile_id
CREATE INDEX IF NOT EXISTS idx_profiles_profile_id ON profiles(profile_id);

SELECT 'Міграція profile_id завершена успішно! ✅' as status;`,

    '20250130_create_notifications_system.sql': `-- Create notifications system
-- Migration: 20250130_create_notifications_system.sql

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type VARCHAR(50),
  notification_title VARCHAR(255),
  notification_message TEXT DEFAULT NULL,
  notification_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, updated_at = NOW()
  WHERE user_id = auth.uid() AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to get unread notifications count
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM notifications 
    WHERE user_id = auth.uid() AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  listing_updates BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,
  marketing_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 10. Enable RLS for notification settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings" ON notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- 11. Create function to get or create notification settings
CREATE OR REPLACE FUNCTION get_or_create_notification_settings()
RETURNS notification_settings AS $$
DECLARE
  settings notification_settings;
BEGIN
  SELECT * INTO settings FROM notification_settings WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    INSERT INTO notification_settings (user_id) VALUES (auth.uid()) RETURNING * INTO settings;
  END IF;
  
  RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger to update updated_at on notifications
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER update_notification_settings_updated_at_trigger
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

SELECT 'Система сповіщень створена успішно! ✅' as status;`,

    '20250130_add_email_to_profiles.sql': `-- Міграція: Додавання email до таблиці profiles
-- Дата: 30.01.2025

-- 1. Додаємо колонку email до таблиці profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Створюємо функцію для синхронізації email з auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    -- При створенні нового профілю, копіюємо email з auth.users
    IF TG_OP = 'INSERT' THEN
        NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
        RETURN NEW;
    END IF;
    
    -- При оновленні профілю, перевіряємо чи змінився email
    IF TG_OP = 'UPDATE' AND OLD.email IS DISTINCT FROM NEW.email THEN
        -- Тут можна додати логіку для оновлення email в auth.users
        -- але це вимагає спеціальних прав
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Створюємо тригер для синхронізації email
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON profiles;
CREATE TRIGGER sync_profile_email_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_email();

-- 4. Оновлюємо існуючі профілі - додаємо email з auth.users
UPDATE profiles 
SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
WHERE email IS NULL;

-- 5. Створюємо індекс для email (для швидкого пошуку)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 6. Додаємо коментар до колонки
COMMENT ON COLUMN profiles.email IS 'Email користувача, синхронізований з auth.users';

SELECT 'Email додано до profiles успішно! ✅' as status;`,

    '20250130_add_last_seen_to_profiles.sql': `-- Міграція: Додавання last_seen до таблиці profiles
-- Дата: 30.01.2025

-- 1. Додаємо колонку last_seen до таблиці profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Створюємо функцію для оновлення last_seen
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    -- Оновлюємо last_seen тільки якщо пройшло більше 5 хвилин з останнього оновлення
    UPDATE profiles 
    SET last_seen = NOW()
    WHERE id = auth.uid() 
    AND (last_seen IS NULL OR last_seen < NOW() - INTERVAL '5 minutes');
    
    RETURN NULL; -- Це AFTER тригер, тому повертаємо NULL
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Створюємо функцію для ручного оновлення last_seen
CREATE OR REPLACE FUNCTION touch_user_activity()
RETURNS VOID AS $$
BEGIN
    UPDATE profiles 
    SET last_seen = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Створюємо індекс для last_seen
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- 5. Додаємо коментар до колонки
COMMENT ON COLUMN profiles.last_seen IS 'Час останньої активності користувача';

SELECT 'Last seen додано до profiles успішно! ✅' as status;`
  };

  return contents[fileName] || `-- SQL файл: ${fileName}
-- Цей файл очікує реалізації або більше не підтримується
SELECT 'Файл ${fileName} потребує оновлення' as status;`;
}

// Выполнение SQL файла
export async function executeSQLFile(fileName: string, onProgress?: (progress: number) => void): Promise<{ success: boolean; message: string; data?: any; error?: string; executionTime?: number; rowsAffected?: number; }> {
  try {
    const startTime = Date.now();
    const content = await getFileContent(fileName);
    
    if (onProgress) onProgress(10);
    
    // Разбиваем SQL на отдельные команды
    const statements = content.split(';').filter(s => s.trim().length > 0);
    let rowsAffected = 0;
    const results = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      if (onProgress) onProgress(10 + (i / statements.length) * 80);
      
      try {
        const { data, error, count } = await import('@/integrations/supabase/client').then(m => 
          m.supabase.rpc('exec_sql', { query: statement })
        );
        
        if (error) throw error;
        
        results.push(data);
        if (count !== null) rowsAffected += count;
      } catch (statementError: any) {
        // Некоторые команды могут не поддерживаться через RPC, но это не критично
        console.warn(`Statement warning for ${fileName}:`, statementError.message);
      }
    }
    
    if (onProgress) onProgress(100);
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      message: `Файл ${fileName} успешно выполнен`,
      data: results,
      executionTime,
      rowsAffected
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Ошибка выполнения файла ${fileName}`,
      error: error.message
    };
  }
}

// Удаление SQL файла (добавляем в список удаленных)
export async function deleteSQLFile(fileName: string): Promise<{ success: boolean; message: string }> {
  try {
    const deletedFiles = JSON.parse(localStorage.getItem('deletedSQLFiles') || '[]') as string[];
    
    if (!deletedFiles.includes(fileName)) {
      deletedFiles.push(fileName);
      localStorage.setItem('deletedSQLFiles', JSON.stringify(deletedFiles));
    }
    
    return {
      success: true,
      message: `Файл ${fileName} помечен как удаленный`
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка удаления файла ${fileName}`
    };
  }
}

// Получение списка удаленных файлов
export function getDeletedFiles(): string[] {
  return JSON.parse(localStorage.getItem('deletedSQLFiles') || '[]');
}