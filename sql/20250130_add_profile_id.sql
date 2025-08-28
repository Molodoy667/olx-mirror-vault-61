-- Add profile_id to profiles table
-- Migration: 20250130_add_profile_id.sql

-- 1. Додаємо колонку profile_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_id VARCHAR(6) UNIQUE;

-- 2. Створюємо індекс для швидкого пошуку
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_profile_id ON profiles(profile_id);

-- 3. Функція для генерації унікального profile_id
CREATE OR REPLACE FUNCTION generate_unique_profile_id()
RETURNS VARCHAR(6) AS $$
DECLARE
  new_id VARCHAR(6);
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Генеруємо випадковий 6-значний ID
    new_id := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Перевіряємо унікальність
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE profile_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    attempt_count := attempt_count + 1;
    
    -- Якщо більше 100 спроб - використовуємо timestamp
    IF attempt_count >= max_attempts THEN
      new_id := LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000000)::TEXT, 6, '0');
      
      -- Якщо і timestamp зайнятий - додаємо случайну цифру
      IF EXISTS (SELECT 1 FROM profiles WHERE profile_id = new_id) THEN
        new_id := LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000000 + FLOOR(RANDOM() * 10))::TEXT, 6, '0');
      END IF;
      
      RETURN new_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Тригер для автоматичного створення profile_id
CREATE OR REPLACE FUNCTION set_profile_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NULL THEN
    NEW.profile_id := generate_unique_profile_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Додаємо тригер на INSERT
DROP TRIGGER IF EXISTS trigger_set_profile_id ON profiles;
CREATE TRIGGER trigger_set_profile_id
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_id();

-- 6. Заповнюємо profile_id для існуючих користувачів
UPDATE profiles 
SET profile_id = generate_unique_profile_id()
WHERE profile_id IS NULL;

-- 7. Робимо profile_id обов'язковим після заповнення
ALTER TABLE profiles ALTER COLUMN profile_id SET NOT NULL;

-- 8. Функція для отримання profile_id по user_id
CREATE OR REPLACE FUNCTION get_profile_id_by_user_id(user_uuid UUID)
RETURNS VARCHAR(6) AS $$
DECLARE
  result VARCHAR(6);
BEGIN
  SELECT profile_id INTO result
  FROM profiles
  WHERE id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Функція для отримання user_id по profile_id
CREATE OR REPLACE FUNCTION get_user_id_by_profile_id(prof_id VARCHAR(6))
RETURNS UUID AS $$
DECLARE
  result UUID;
BEGIN
  SELECT id INTO result
  FROM profiles
  WHERE profile_id = prof_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Надаємо права на виконання функцій
GRANT EXECUTE ON FUNCTION get_profile_id_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id_by_profile_id(VARCHAR) TO authenticated;

-- 11. Перевіряємо результат
SELECT 'Profile ID system created successfully! ✅' as status;

-- 12. Показуємо приклади створених profile_id
SELECT 
  id,
  full_name,
  profile_id,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- ✅ ГОТОВО! Система profile_id створена та налаштована!