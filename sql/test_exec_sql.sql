-- 🧪 ТЕСТ ФУНКЦІЇ exec_sql
-- Перевіряємо чи працює виконання SQL через RPC

-- 1. ПРОСТИЙ ТЕСТ
SELECT 'Тест exec_sql працює!' as test_message, NOW() as current_time;

-- 2. ПЕРЕВІРКА ІСНУВАННЯ exec_sql ФУНКЦІЇ
SELECT 
  'exec_sql function check:' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'exec_sql'
    ) 
    THEN '✅ exec_sql функція існує' 
    ELSE '❌ exec_sql функція НЕ існує' 
  END as status;

-- 3. СПИСОК ВСІХ PUBLIC ФУНКЦІЙ
SELECT 
  'Available functions:' as info,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;

-- 4. ТЕСТ СТВОРЕННЯ ПРОСТОЇ ФУНКЦІЇ
CREATE OR REPLACE FUNCTION public.test_function()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'Test function created successfully!' as result;
$$;

-- 5. ВИКЛИК ТЕСТОВОЇ ФУНКЦІЇ
SELECT public.test_function() as test_result;