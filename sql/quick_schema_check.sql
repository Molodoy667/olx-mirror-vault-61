-- Швидка перевірка схеми БД
-- Основні таблиці та їх структура

-- 1. СПИСОК ВСІХ ТАБЛИЦЬ
SELECT tablename as "📁 Таблиці в БД"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. ОСНОВНІ КОРИСТУВАЦЬКІ ТАБЛИЦІ (найімовірніші)
SELECT 
  table_name as "🏗️ Таблиця",
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as "📊 Колонок"
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE '%_backup%'
  AND t.table_name NOT LIKE 'pg_%'
ORDER BY t.table_name;

-- 3. ШВИДКИЙ ОГЛЯД КОРИСТУВАЧІВ (якщо є auth)
-- Перевіряємо чи є таблиця profiles або users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    RAISE NOTICE '👤 Знайдена таблиця profiles';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    RAISE NOTICE '👥 Знайдена таблиця users';
  END IF;
END $$;

-- 4. ШВИДКИЙ ОГЛЯД LISTINGS (якщо є)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listings' AND table_schema = 'public') THEN
    RAISE NOTICE '📝 Знайдена таблиця listings (оголошення)';
  END IF;
END $$;

-- 5. ПЕРЕВІРКА КАТЕГОРІЙ
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
    RAISE NOTICE '📂 Знайдена таблиця categories';
  END IF;
END $$;

-- 6. ШВИДКИЙ ПЕРЕГЛЯД AUTH ТАБЛИЦЬ (Supabase)
SELECT 
  schemaname as схема,
  tablename as таблиця
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 7. ФУНКЦІЇ В PUBLIC СХЕМІ
SELECT 
  proname as "⚙️ Функції",
  prokind as тип
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;