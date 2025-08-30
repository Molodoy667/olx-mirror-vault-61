-- 💬 ОНОВЛЕННЯ СИСТЕМИ ПОВІДОМЛЕНЬ
-- Додавання типів повідомлень та онлайн статусу

-- 1. Додавання поля message_type до таблиці messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(10) DEFAULT 'general';

-- Додавання коментаря
COMMENT ON COLUMN messages.message_type IS 'Тип повідомлення: buying (покупка), selling (продаж), general (загальне)';

-- 2. Оновлення існуючих повідомлень на основі логіки власності оголошень
UPDATE messages 
SET message_type = CASE 
  WHEN listing_id IS NOT NULL THEN
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM listings 
        WHERE listings.id = messages.listing_id 
        AND listings.user_id = messages.receiver_id
      ) THEN 'buying'  -- Пишуть власнику оголошення (хочуть купити)
      WHEN EXISTS (
        SELECT 1 FROM listings 
        WHERE listings.id = messages.listing_id 
        AND listings.user_id = messages.sender_id
      ) THEN 'selling' -- Власник оголошення відповідає (продає)
      ELSE 'general'
    END
  ELSE 'general'
END
WHERE message_type = 'general' OR message_type IS NULL;

-- 3. Додавання полів онлайн статусу до таблиці users (якщо не існують)
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 4. Створення функції для оновлення онлайн статусу
CREATE OR REPLACE FUNCTION update_user_online_status(user_uuid UUID, is_online_status BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users 
  SET 
    is_online = is_online_status,
    last_seen = CASE 
      WHEN is_online_status = FALSE THEN now()
      ELSE last_seen
    END
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Створення тригера для автоматичного оновлення last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  -- Оновлюємо last_seen при будь-якій активності користувача
  UPDATE auth.users 
  SET last_seen = now()
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Додаємо тригер на вставку нових повідомлень
DROP TRIGGER IF EXISTS update_sender_last_seen ON messages;
CREATE TRIGGER update_sender_last_seen
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- 6. Створення view для зручного отримання розмов
CREATE OR REPLACE VIEW user_conversations AS
SELECT DISTINCT
  CASE 
    WHEN m.sender_id = u.id THEN m.receiver_id
    ELSE m.sender_id
  END as other_user_id,
  u.id as current_user_id,
  m.message_type,
  m.listing_id,
  l.title as listing_title,
  l.price as listing_price,
  (
    SELECT content 
    FROM messages m2 
    WHERE (m2.sender_id = u.id AND m2.receiver_id = CASE WHEN m.sender_id = u.id THEN m.receiver_id ELSE m.sender_id END)
       OR (m2.receiver_id = u.id AND m2.sender_id = CASE WHEN m.sender_id = u.id THEN m.receiver_id ELSE m.sender_id END)
    ORDER BY m2.created_at DESC 
    LIMIT 1
  ) as last_message,
  (
    SELECT created_at 
    FROM messages m2 
    WHERE (m2.sender_id = u.id AND m2.receiver_id = CASE WHEN m.sender_id = u.id THEN m.receiver_id ELSE m.sender_id END)
       OR (m2.receiver_id = u.id AND m2.sender_id = CASE WHEN m.sender_id = u.id THEN m.receiver_id ELSE m.sender_id END)
    ORDER BY m2.created_at DESC 
    LIMIT 1
  ) as last_message_time,
  (
    SELECT COUNT(*)
    FROM messages m2 
    WHERE m2.sender_id = CASE WHEN m.sender_id = u.id THEN m.receiver_id ELSE m.sender_id END
      AND m2.receiver_id = u.id
      AND m2.is_read = FALSE
  ) as unread_count
FROM messages m
JOIN auth.users u ON u.id = auth.uid()
LEFT JOIN listings l ON l.id = m.listing_id
WHERE m.sender_id = u.id OR m.receiver_id = u.id;

-- 7. Надання прав на функції та view
GRANT EXECUTE ON FUNCTION update_user_online_status(UUID, BOOLEAN) TO authenticated;
GRANT SELECT ON user_conversations TO authenticated;

-- 8. RLS для нового поля
-- (RLS вже налаштовано для таблиці messages, нове поле автоматично захищено)

SELECT 'Система повідомлень оновлена успішно! 💬' as status,
       'Додано типи повідомлень та онлайн статус! ✅' as message;