-- 🔍 ДІАГНОСТИКА DATABASE MANAGER
-- Перевіряємо чи створені функції та чи працюють

-- 1. ПЕРЕВІРЯЄМО ЧИ ІСНУЮТЬ ФУНКЦІЇ
SELECT 
  'Перевірка функцій Database Manager:' as step,
  COUNT(*) as created_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('get_all_tables', 'get_table_structure', 'get_table_data', 'get_all_functions');

-- 2. СПИСОК СТВОРЕНИХ ФУНКЦІЙ
SELECT 
  'Створені функції:' as info,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%get_%'
ORDER BY p.proname;

-- 3. ТЕСТУЄМО ФУНКЦІЮ get_all_tables НАПРЯМУ
SELECT 'Тест get_all_tables:' as test;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_tables') THEN
    RAISE NOTICE '✅ Функція get_all_tables існує';
  ELSE
    RAISE NOTICE '❌ Функція get_all_tables НЕ існує';
  END IF;
END $$;

-- 4. ПРОСТИЙ ТЕСТ ТАБЛИЦЬ ЧЕРЕЗ СТАНДАРТНІ ЗАПИТИ
SELECT 
  'Прямий запит таблиць:' as direct_test,
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename
LIMIT 5;

-- 5. ПЕРЕВІРЯЄМО ПРАВА ДОСТУПУ
SELECT 
  'Права доступу на функції:' as permissions,
  p.proname,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('get_all_tables', 'get_table_structure', 'get_table_data', 'get_all_functions');

-- 6. СПРОБА ВИКЛИКУ get_all_tables
SELECT 'Спроба виклику get_all_tables:' as attempt;

DO $$
BEGIN
  BEGIN
    PERFORM * FROM public.get_all_tables() LIMIT 1;
    RAISE NOTICE '✅ get_all_tables працює!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Помилка get_all_tables: %', SQLERRM;
  END;
END $$;