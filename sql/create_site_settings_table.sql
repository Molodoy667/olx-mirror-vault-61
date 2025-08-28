-- 🌐 СТВОРЕННЯ ТАБЛИЦІ НАЛАШТУВАНЬ САЙТУ
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
    
    -- 🔗 Соціальні мережі
    facebook_url TEXT,
    instagram_url TEXT,
    telegram_url TEXT,
    youtube_url TEXT,
    twitter_url TEXT,
    linkedin_url TEXT,
    
    -- ⚙️ Технічні налаштування
    max_images_per_listing INTEGER DEFAULT 10 CHECK (max_images_per_listing BETWEEN 1 AND 50),
    max_listing_price DECIMAL(15,2) DEFAULT 999999.99,
    auto_approve_listings BOOLEAN DEFAULT false,
    maintenance_mode BOOLEAN DEFAULT false,
    registration_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    
    -- 📧 Налаштування пошти
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_user VARCHAR(255),
    smtp_from_email VARCHAR(255),
    smtp_from_name VARCHAR(100),
    
    -- 🎯 Аналітика та трекінг
    google_analytics_id VARCHAR(50),
    google_tag_manager_id VARCHAR(50),
    facebook_pixel_id VARCHAR(50),
    
    -- 💰 Платіжні системи
    stripe_public_key TEXT,
    paypal_client_id TEXT,
    liqpay_public_key TEXT,
    
    -- 📞 Месенджери та підтримка
    support_chat_enabled BOOLEAN DEFAULT true,
    whatsapp_number VARCHAR(20),
    viber_number VARCHAR(20),
    
    -- 🔐 Безпека
    max_login_attempts INTEGER DEFAULT 5,
    session_timeout INTEGER DEFAULT 3600,
    require_email_verification BOOLEAN DEFAULT true,
    
    -- 📊 Налаштування контенту
    default_listing_duration INTEGER DEFAULT 30,
    featured_listings_count INTEGER DEFAULT 8,
    max_search_results INTEGER DEFAULT 50,
    
    -- 📅 Система
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Обмеження
    CONSTRAINT valid_email CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR contact_email IS NULL),
    CONSTRAINT valid_colors CHECK (
        primary_color ~* '^#[0-9A-Fa-f]{6}$' AND 
        secondary_color ~* '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT valid_url_formats CHECK (
        (logo_url IS NULL OR logo_url ~* '^https?://.*') AND
        (favicon_url IS NULL OR favicon_url ~* '^https?://.*') AND
        (og_image IS NULL OR og_image ~* '^https?://.*')
    )
);

-- 2. Створення індексів
CREATE INDEX IF NOT EXISTS idx_site_settings_updated_at ON site_settings(updated_at);

-- 3. RLS (Row Level Security)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Політики доступу
CREATE POLICY "Allow public read access to site_settings" ON site_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow admin full access to site_settings" ON site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 4. Функція автоматичного оновлення часу
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Тригер для автоматичного оновлення
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();

-- 6. Вставка дефолтних налаштувань
INSERT INTO site_settings (
    site_name,
    site_description,
    meta_title,
    meta_description,
    contact_email,
    city,
    country
) VALUES (
    'Novado',
    'Найкращий маркетплейс України для купівлі та продажу товарів',
    'Novado - Маркетплейс України',
    'Купуйте та продавайте товари на найкращому маркетплейсі України. Безкоштовні оголошення, безпечні угоди.',
    'admin@novado.store',
    'Київ',
    'Україна'
) ON CONFLICT DO NOTHING;

-- 7. Функція для отримання налаштувань
CREATE OR REPLACE FUNCTION get_site_settings()
RETURNS site_settings AS $$
DECLARE
    settings site_settings;
BEGIN
    SELECT * INTO settings FROM site_settings ORDER BY updated_at DESC LIMIT 1;
    RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Функція для оновлення налаштувань
CREATE OR REPLACE FUNCTION update_site_settings(settings_json JSONB)
RETURNS site_settings AS $$
DECLARE
    updated_settings site_settings;
    setting_key TEXT;
    setting_value TEXT;
BEGIN
    -- Перевіряємо права доступу
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    -- Оновлюємо налаштування
    UPDATE site_settings SET
        site_name = COALESCE((settings_json->>'site_name')::VARCHAR(100), site_name),
        site_description = COALESCE(settings_json->>'site_description', site_description),
        site_keywords = COALESCE(settings_json->>'site_keywords', site_keywords),
        contact_email = COALESCE((settings_json->>'contact_email')::VARCHAR(255), contact_email),
        contact_phone = COALESCE((settings_json->>'contact_phone')::VARCHAR(50), contact_phone),
        address = COALESCE(settings_json->>'address', address),
        city = COALESCE((settings_json->>'city')::VARCHAR(100), city),
        country = COALESCE((settings_json->>'country')::VARCHAR(100), country),
        timezone = COALESCE((settings_json->>'timezone')::VARCHAR(50), timezone),
        language = COALESCE((settings_json->>'language')::VARCHAR(10), language),
        currency = COALESCE((settings_json->>'currency')::VARCHAR(10), currency),
        logo_url = COALESCE(settings_json->>'logo_url', logo_url),
        favicon_url = COALESCE(settings_json->>'favicon_url', favicon_url),
        primary_color = COALESCE((settings_json->>'primary_color')::VARCHAR(7), primary_color),
        secondary_color = COALESCE((settings_json->>'secondary_color')::VARCHAR(7), secondary_color),
        meta_title = COALESCE((settings_json->>'meta_title')::VARCHAR(60), meta_title),
        meta_description = COALESCE((settings_json->>'meta_description')::VARCHAR(160), meta_description),
        meta_keywords = COALESCE(settings_json->>'meta_keywords', meta_keywords),
        og_title = COALESCE((settings_json->>'og_title')::VARCHAR(60), og_title),
        og_description = COALESCE((settings_json->>'og_description')::VARCHAR(160), og_description),
        og_image = COALESCE(settings_json->>'og_image', og_image),
        facebook_url = COALESCE(settings_json->>'facebook_url', facebook_url),
        instagram_url = COALESCE(settings_json->>'instagram_url', instagram_url),
        telegram_url = COALESCE(settings_json->>'telegram_url', telegram_url),
        youtube_url = COALESCE(settings_json->>'youtube_url', youtube_url),
        twitter_url = COALESCE(settings_json->>'twitter_url', twitter_url),
        linkedin_url = COALESCE(settings_json->>'linkedin_url', linkedin_url),
        max_images_per_listing = COALESCE((settings_json->>'max_images_per_listing')::INTEGER, max_images_per_listing),
        max_listing_price = COALESCE((settings_json->>'max_listing_price')::DECIMAL(15,2), max_listing_price),
        auto_approve_listings = COALESCE((settings_json->>'auto_approve_listings')::BOOLEAN, auto_approve_listings),
        maintenance_mode = COALESCE((settings_json->>'maintenance_mode')::BOOLEAN, maintenance_mode),
        registration_enabled = COALESCE((settings_json->>'registration_enabled')::BOOLEAN, registration_enabled),
        email_notifications = COALESCE((settings_json->>'email_notifications')::BOOLEAN, email_notifications),
        google_analytics_id = COALESCE((settings_json->>'google_analytics_id')::VARCHAR(50), google_analytics_id),
        facebook_pixel_id = COALESCE((settings_json->>'facebook_pixel_id')::VARCHAR(50), facebook_pixel_id),
        support_chat_enabled = COALESCE((settings_json->>'support_chat_enabled')::BOOLEAN, support_chat_enabled),
        whatsapp_number = COALESCE((settings_json->>'whatsapp_number')::VARCHAR(20), whatsapp_number),
        require_email_verification = COALESCE((settings_json->>'require_email_verification')::BOOLEAN, require_email_verification),
        default_listing_duration = COALESCE((settings_json->>'default_listing_duration')::INTEGER, default_listing_duration),
        featured_listings_count = COALESCE((settings_json->>'featured_listings_count')::INTEGER, featured_listings_count)
    WHERE id = (SELECT id FROM site_settings ORDER BY updated_at DESC LIMIT 1)
    RETURNING * INTO updated_settings;
    
    RETURN updated_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Надання прав
GRANT SELECT ON site_settings TO authenticated;
GRANT SELECT ON site_settings TO anon;
GRANT EXECUTE ON FUNCTION get_site_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION get_site_settings() TO anon;
GRANT EXECUTE ON FUNCTION update_site_settings(JSONB) TO authenticated;

-- 10. Перевірка статусу
SELECT 'Таблиця site_settings створена успішно! ✅' as status;

-- Перевірка існування таблиці
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'site_settings' 
ORDER BY ordinal_position;

-- Перевірка політик RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'site_settings';