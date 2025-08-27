-- Міграція: Створення RPC функцій для аналізу БД
-- Дата: 2025-01-28
-- Опис: Створює безпечні функції для отримання метаданих БД

-- 1. Функція для отримання списку таблиць
CREATE OR REPLACE FUNCTION public.get_tables_info()
RETURNS TABLE (
  table_name TEXT,
  column_count BIGINT,
  has_primary_key BOOLEAN,
  estimated_rows BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.tablename AND c.table_schema = 'public')::BIGINT,
    EXISTS(
      SELECT 1 FROM information_schema.table_constraints tc 
      WHERE tc.table_name = t.tablename AND tc.constraint_type = 'PRIMARY KEY'
    ) as has_primary_key,
    COALESCE(s.n_live_tup, 0)::BIGINT
  FROM pg_tables t
  LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

-- 2. Функція для отримання колонок таблиці
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name_param TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable BOOLEAN,
  column_default TEXT,
  is_primary_key BOOLEAN,
  is_foreign_key BOOLEAN,
  foreign_table TEXT,
  foreign_column TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    CASE 
      WHEN c.character_maximum_length IS NOT NULL THEN 
        c.data_type || '(' || c.character_maximum_length || ')'
      WHEN c.numeric_precision IS NOT NULL THEN 
        c.data_type || '(' || c.numeric_precision || ',' || COALESCE(c.numeric_scale, 0) || ')'
      ELSE c.data_type
    END::TEXT as data_type,
    CASE WHEN c.is_nullable = 'YES' THEN TRUE ELSE FALSE END as is_nullable,
    c.column_default::TEXT,
    EXISTS(
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = table_name_param 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = c.column_name
    ) as is_primary_key,
    EXISTS(
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = table_name_param 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = c.column_name
    ) as is_foreign_key,
    (
      SELECT ccu.table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = table_name_param 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = c.column_name
      LIMIT 1
    )::TEXT as foreign_table,
    (
      SELECT ccu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = table_name_param 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = c.column_name
      LIMIT 1
    )::TEXT as foreign_column
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END;
$$;

-- 3. Функція для отримання обмежень таблиці
CREATE OR REPLACE FUNCTION public.get_table_constraints(table_name_param TEXT)
RETURNS TABLE (
  constraint_name TEXT,
  constraint_type TEXT,
  column_names TEXT[],
  foreign_table TEXT,
  foreign_columns TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tc.constraint_name::TEXT,
    tc.constraint_type::TEXT,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position)::TEXT[] as column_names,
    ccu.table_name::TEXT as foreign_table,
    array_agg(ccu.column_name ORDER BY kcu.ordinal_position)::TEXT[] as foreign_columns
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.table_schema = 'public'
    AND tc.table_name = table_name_param
  GROUP BY tc.constraint_name, tc.constraint_type, ccu.table_name
  ORDER BY tc.constraint_type, tc.constraint_name;
END;
$$;

-- 4. Функція для отримання індексів таблиці
CREATE OR REPLACE FUNCTION public.get_table_indexes(table_name_param TEXT)
RETURNS TABLE (
  index_name TEXT,
  is_unique BOOLEAN,
  column_names TEXT[],
  index_definition TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.indexname::TEXT,
    i.indexdef LIKE '%UNIQUE%' as is_unique,
    ARRAY[a.attname]::TEXT[] as column_names, -- Спрощена версія
    i.indexdef::TEXT
  FROM pg_indexes i
  LEFT JOIN pg_class c ON c.relname = i.indexname
  LEFT JOIN pg_attribute a ON a.attrelid = c.oid
  WHERE i.schemaname = 'public'
    AND i.tablename = table_name_param
  GROUP BY i.indexname, i.indexdef
  ORDER BY i.indexname;
END;
$$;

-- 5. Функція для отримання кількості рядків
CREATE OR REPLACE FUNCTION public.get_table_row_count(table_name_param TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  row_count BIGINT;
BEGIN
  -- Використовуємо статистику замість COUNT(*) для швидкості
  SELECT COALESCE(n_live_tup, 0) INTO row_count
  FROM pg_stat_user_tables 
  WHERE relname = table_name_param;
  
  RETURN COALESCE(row_count, 0);
END;
$$;

-- 6. Функція для отримання функцій БД
CREATE OR REPLACE FUNCTION public.get_database_functions()
RETURNS TABLE (
  function_name TEXT,
  arguments TEXT,
  return_type TEXT,
  language TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::TEXT,
    pg_get_function_arguments(p.oid)::TEXT,
    pg_get_function_result(p.oid)::TEXT,
    l.lanname::TEXT
  FROM pg_proc p
  LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
  LEFT JOIN pg_language l ON p.prolang = l.oid
  WHERE n.nspname = 'public'
    AND p.prokind = 'f' -- тільки функції, не процедури
  ORDER BY p.proname;
END;
$$;

-- 7. Функція для отримання ENUM типів
CREATE OR REPLACE FUNCTION public.get_database_enums()
RETURNS TABLE (
  enum_name TEXT,
  enum_values TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.typname::TEXT,
    array_agg(e.enumlabel ORDER BY e.enumsortorder)::TEXT[]
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = 'public'
  GROUP BY t.typname
  ORDER BY t.typname;
END;
$$;

-- 8. Функція для повного аналізу схеми БД
CREATE OR REPLACE FUNCTION public.analyze_database_schema()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  tables_info JSON;
  functions_info JSON;
  enums_info JSON;
BEGIN
  -- Збираємо інформацію про таблиці
  SELECT json_agg(row_to_json(t)) INTO tables_info
  FROM public.get_tables_info() t;
  
  -- Збираємо інформацію про функції
  SELECT json_agg(row_to_json(f)) INTO functions_info
  FROM public.get_database_functions() f;
  
  -- Збираємо інформацію про ENUM типи
  SELECT json_agg(row_to_json(e)) INTO enums_info
  FROM public.get_database_enums() e;
  
  -- Формуємо загальний результат
  result := json_build_object(
    'tables', COALESCE(tables_info, '[]'::json),
    'functions', COALESCE(functions_info, '[]'::json),
    'enums', COALESCE(enums_info, '[]'::json),
    'analyzed_at', now(),
    'total_tables', (SELECT count(*) FROM public.get_tables_info())
  );
  
  RETURN result;
END;
$$;

-- 9. Функція для генерації міграції
CREATE OR REPLACE FUNCTION public.generate_migration(
  migration_name TEXT,
  migration_description TEXT,
  sql_commands TEXT[]
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  migration_content TEXT;
  cmd TEXT;
BEGIN
  -- Генеруємо заголовок міграції
  migration_content := '-- Міграція: ' || migration_name || E'\n';
  migration_content := migration_content || '-- Опис: ' || migration_description || E'\n';
  migration_content := migration_content || '-- Створена: ' || now() || E'\n\n';
  
  -- Додаємо SQL команди
  FOREACH cmd IN ARRAY sql_commands
  LOOP
    migration_content := migration_content || cmd || E';\n\n';
  END LOOP;
  
  -- Додаємо підтвердження виконання
  migration_content := migration_content || 'SELECT ''Міграція ' || migration_name || ' виконана успішно!'' as result;';
  
  RETURN migration_content;
END;
$$;

-- Права доступу для безпеки
GRANT EXECUTE ON FUNCTION public.get_tables_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_constraints(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_indexes(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_row_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_functions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_enums() TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_database_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_migration(TEXT, TEXT, TEXT[]) TO authenticated;

-- Коментарі
COMMENT ON FUNCTION public.get_tables_info() IS 'Отримує список всіх таблиць з базовою інформацією';
COMMENT ON FUNCTION public.get_table_columns(TEXT) IS 'Отримує детальну інформацію про колонки таблиці';
COMMENT ON FUNCTION public.get_table_constraints(TEXT) IS 'Отримує всі обмеження таблиці';
COMMENT ON FUNCTION public.get_table_indexes(TEXT) IS 'Отримує всі індекси таблиці';
COMMENT ON FUNCTION public.analyze_database_schema() IS 'Повний аналіз схеми БД у форматі JSON';
COMMENT ON FUNCTION public.generate_migration(TEXT, TEXT, TEXT[]) IS 'Генерує SQL міграцію з переданих команд';

SELECT 'RPC функції для аналізу БД створено успішно!' as result;