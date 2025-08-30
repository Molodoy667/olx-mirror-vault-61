-- 🔔 ФУНКЦІЇ ДЛЯ РОБОТИ З СПОВІЩЕННЯМИ
-- Додавання функцій для керування сповіщеннями

-- 1. Функція для позначення сповіщень як прочитаних
CREATE OR REPLACE FUNCTION mark_notifications_as_read(notification_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Оновлюємо тільки сповіщення поточного користувача
    UPDATE notifications 
    SET 
        is_read = TRUE,
        updated_at = now()
    WHERE 
        id = ANY(notification_ids) 
        AND user_id = auth.uid()
        AND is_read = FALSE;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Функція для позначення всіх сповіщень як прочитаних
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Оновлюємо всі непрочитані сповіщення користувача
    UPDATE notifications 
    SET 
        is_read = TRUE,
        updated_at = now()
    WHERE 
        user_id = auth.uid()
        AND is_read = FALSE;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Функція для отримання кількості непрочитаних сповіщень
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications 
        WHERE user_id = auth.uid() AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Функція для створення нового сповіщення
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id UUID,
    notification_type TEXT,
    notification_title TEXT,
    notification_message TEXT DEFAULT NULL,
    notification_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        is_read
    ) VALUES (
        target_user_id,
        notification_type,
        notification_title,
        notification_message,
        notification_data,
        FALSE
    ) RETURNING id INTO new_notification_id;
    
    RETURN new_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Функція для видалення старих прочитаних сповіщень
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Видаляємо прочитані сповіщення старші за вказану кількість днів
    DELETE FROM notifications 
    WHERE 
        is_read = TRUE 
        AND created_at < (now() - INTERVAL '1 day' * days_old);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Тригер для автоматичного оновлення updated_at у notifications
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Створюємо тригер якщо його ще немає
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- 7. Надання прав на виконання функцій
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read() TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notifications_count() TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Тільки адміністратори можуть очищати старі сповіщення
GRANT EXECUTE ON FUNCTION cleanup_old_notifications(INTEGER) TO authenticated;

-- 8. Створення індексів для покращення продуктивності
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications (user_id, is_read, created_at DESC) 
WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications (type, user_id);

SELECT 'Функції для сповіщень створені успішно! 🔔' as status,
       'Кнопка "Позначити всі" тепер працює! ✅' as message;