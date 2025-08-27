-- 🔧 СТВОРЕННЯ ФУНКЦІЇ exec_sql
-- Основна функція для виконання SQL запитів через RPC
-- ОБОВ'ЯЗКОВО виконайте цей файл ПЕРШИМ!

-- 1. СТВОРЮЄМО exec_sql ФУНКЦІЮ
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  row_count_val INTEGER;
  start_time TIMESTAMPTZ;
  execution_time INTEGER;
BEGIN
  -- Записуємо час початку
  start_time := clock_timestamp();
  
  -- Виконуємо SQL запит
  EXECUTE sql_query;
  
  -- Отримуємо кількість оброблених рядків
  GET DIAGNOSTICS row_count_val = ROW_COUNT;
  
  -- Розраховуємо час виконання
  execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
  
  -- Повертаємо успішний результат
  RETURN json_build_object(
    'success', true, 
    'message', 'SQL виконано успішно',
    'rows_affected', row_count_val,
    'execution_time', execution_time
  );
  
EXCEPTION WHEN others THEN
  -- У разі помилки повертаємо деталі
  execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
  
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'error_code', SQLSTATE,
    'message', 'Помилка виконання SQL',
    'execution_time', execution_time
  );
END;
$$;

-- 2. НАДАЄМО ПРАВА ДОСТУПУ
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO anon;

-- 3. ТЕСТУЄМО ФУНКЦІЮ
SELECT 'exec_sql функція створена успішно!' as status;

-- 4. ПРОСТИЙ ТЕСТ
SELECT public.exec_sql('SELECT ''Тест успішний!'' as test_message') as test_result;

-- 5. ПОВІДОМЛЕННЯ
SELECT '✅ ГОТОВО! Тепер можете виконувати SQL файли через Файл Менеджер!' as final_message;