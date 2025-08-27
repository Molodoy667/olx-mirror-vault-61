-- Повноцінний Database Manager для OLX
-- Дата: 2025-01-28
-- RPC функції для перегляду та управління базою даних

-- 1. ФУНКЦІЯ ДЛЯ ОТРИМАННЯ СПИСКУ ВСІХ ТАБЛИЦЬ
CREATE OR REPLACE FUNCTION public.get_all_tables()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    COALESCE(s.n_live_tup, 0) as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.tablename)::regclass))::TEXT,
    COALESCE(d.description, 'Немає опису')::TEXT
  FROM pg_tables t
  LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
  LEFT JOIN pg_description d ON d.objoid = quote_ident(t.tablename)::regclass
  WHERE t.schemaname = 'public'
  ORDER BY COALESCE(s.n_live_tup, 0) DESC;
END;
$$;

-- 2. ФУНКЦІЯ ДЛЯ ОТРИМАННЯ СТРУКТУРИ ТАБЛИЦІ
CREATE OR REPLACE FUNCTION public.get_table_structure(table_name_param TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
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
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    COALESCE(c.column_default, '')::TEXT,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
    CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key,
    COALESCE(fk.foreign_table_name, '')::TEXT,
    COALESCE(fk.foreign_column_name, '')::TEXT
  FROM information_schema.columns c
  LEFT JOIN (
    SELECT ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' 
      AND tc.table_name = table_name_param
      AND tc.table_schema = 'public'
  ) pk ON c.column_name = pk.column_name
  LEFT JOIN (
    SELECT 
      ku.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = table_name_param
      AND tc.table_schema = 'public'
  ) fk ON c.column_name = fk.column_name
  WHERE c.table_name = table_name_param
    AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
END;
$$;

-- 3. ФУНКЦІЯ ДЛЯ ОТРИМАННЯ ДАНИХ ТАБЛИЦІ З ПАГІНАЦІЄЮ
CREATE OR REPLACE FUNCTION public.get_table_data(
  table_name_param TEXT,
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 50,
  search_query TEXT DEFAULT '',
  order_column TEXT DEFAULT '',
  order_direction TEXT DEFAULT 'ASC'
)
RETURNS TABLE (
  data JSONB,
  total_count BIGINT,
  page_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INT;
  total_rows BIGINT;
  sql_query TEXT;
  count_query TEXT;
  safe_table_name TEXT;
  safe_order_column TEXT;
  safe_direction TEXT;
BEGIN
  -- Безпека: перевіряємо що таблиця існує
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = table_name_param AND schemaname = 'public'
  ) THEN
    RAISE EXCEPTION 'Таблиця % не існує', table_name_param;
  END IF;

  -- Екранування імені таблиці
  safe_table_name := quote_ident(table_name_param);
  
  -- Підготовка пагінації
  offset_val := (page_number - 1) * page_size;
  
  -- Підготовка сортування
  IF order_column = '' THEN
    safe_order_column := 'created_at';
    -- Перевіряємо чи існує created_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name_param 
        AND column_name = 'created_at' 
        AND table_schema = 'public'
    ) THEN
      -- Якщо created_at немає, беремо першу колонку
      SELECT column_name INTO safe_order_column
      FROM information_schema.columns 
      WHERE table_name = table_name_param AND table_schema = 'public'
      ORDER BY ordinal_position LIMIT 1;
    END IF;
  ELSE
    -- Перевіряємо що колонка існує
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name_param 
        AND column_name = order_column 
        AND table_schema = 'public'
    ) THEN
      safe_order_column := quote_ident(order_column);
    ELSE
      safe_order_column := 'created_at';
    END IF;
  END IF;
  
  safe_direction := CASE WHEN UPPER(order_direction) = 'DESC' THEN 'DESC' ELSE 'ASC' END;

  -- Підрахунок загальної кількості записів
  count_query := format('SELECT COUNT(*) FROM %I', table_name_param);
  
  IF search_query != '' THEN
    count_query := count_query || format(' WHERE CAST(%I AS TEXT) ILIKE %L', 
      safe_order_column, '%' || search_query || '%');
  END IF;
  
  EXECUTE count_query INTO total_rows;

  -- Основний запит для отримання даних
  sql_query := format(
    'SELECT json_agg(row_to_json(%I.*)) FROM (SELECT * FROM %I',
    table_name_param, table_name_param
  );
  
  IF search_query != '' THEN
    sql_query := sql_query || format(' WHERE CAST(%I AS TEXT) ILIKE %L', 
      safe_order_column, '%' || search_query || '%');
  END IF;
  
  sql_query := sql_query || format(' ORDER BY %I %s LIMIT %s OFFSET %s) %I',
    safe_order_column, safe_direction, page_size, offset_val, table_name_param
  );

  -- Виконання запиту
  RETURN QUERY
  SELECT 
    COALESCE((SELECT json_agg FROM (EXECUTE sql_query) AS t(json_agg)), '[]'::jsonb) as data,
    total_rows,
    CEIL(total_rows::NUMERIC / page_size)::INT as page_count;
END;
$$;

-- 4. ФУНКЦІЯ ДЛЯ ВСТАВКИ НОВОГО ЗАПИСУ
CREATE OR REPLACE FUNCTION public.insert_table_record(
  table_name_param TEXT,
  record_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  columns_list TEXT[];
  values_list TEXT[];
  key TEXT;
  result JSONB;
BEGIN
  -- Безпека: перевіряємо що таблиця існує
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = table_name_param AND schemaname = 'public'
  ) THEN
    RAISE EXCEPTION 'Таблиця % не існує', table_name_param;
  END IF;

  -- Підготовка колонок та значень
  FOR key IN SELECT jsonb_object_keys(record_data)
  LOOP
    -- Перевіряємо що колонка існує
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name_param 
        AND column_name = key 
        AND table_schema = 'public'
    ) THEN
      columns_list := array_append(columns_list, quote_ident(key));
      values_list := array_append(values_list, quote_literal(record_data->>key));
    END IF;
  END LOOP;

  IF array_length(columns_list, 1) = 0 THEN
    RAISE EXCEPTION 'Немає валідних колонок для вставки';
  END IF;

  -- Формування SQL запиту
  sql_query := format(
    'INSERT INTO %I (%s) VALUES (%s) RETURNING row_to_json(%I.*)',
    table_name_param,
    array_to_string(columns_list, ', '),
    array_to_string(values_list, ', '),
    table_name_param
  );

  -- Виконання запиту
  EXECUTE sql_query INTO result;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 5. ФУНКЦІЯ ДЛЯ ОНОВЛЕННЯ ЗАПИСУ
CREATE OR REPLACE FUNCTION public.update_table_record(
  table_name_param TEXT,
  record_id TEXT,
  record_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  set_clauses TEXT[];
  key TEXT;
  pk_column TEXT;
  result JSONB;
BEGIN
  -- Безпека: перевіряємо що таблиця існує
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = table_name_param AND schemaname = 'public'
  ) THEN
    RAISE EXCEPTION 'Таблиця % не існує', table_name_param;
  END IF;

  -- Знаходимо primary key колонку
  SELECT ku.column_name INTO pk_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
  WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_name = table_name_param
    AND tc.table_schema = 'public'
  LIMIT 1;

  IF pk_column IS NULL THEN
    pk_column := 'id'; -- За замовчуванням
  END IF;

  -- Підготовка SET кляузул
  FOR key IN SELECT jsonb_object_keys(record_data)
  LOOP
    -- Перевіряємо що колонка існує і це не primary key
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = table_name_param 
        AND column_name = key 
        AND table_schema = 'public'
    ) AND key != pk_column THEN
      set_clauses := array_append(
        set_clauses, 
        format('%I = %L', key, record_data->>key)
      );
    END IF;
  END LOOP;

  IF array_length(set_clauses, 1) = 0 THEN
    RAISE EXCEPTION 'Немає валідних колонок для оновлення';
  END IF;

  -- Формування SQL запиту
  sql_query := format(
    'UPDATE %I SET %s WHERE %I = %L RETURNING row_to_json(%I.*)',
    table_name_param,
    array_to_string(set_clauses, ', '),
    pk_column,
    record_id,
    table_name_param
  );

  -- Виконання запиту
  EXECUTE sql_query INTO result;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- 6. ФУНКЦІЯ ДЛЯ ВИДАЛЕННЯ ЗАПИСУ
CREATE OR REPLACE FUNCTION public.delete_table_record(
  table_name_param TEXT,
  record_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  pk_column TEXT;
  affected_rows INT;
BEGIN
  -- Безпека: перевіряємо що таблиця існує
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = table_name_param AND schemaname = 'public'
  ) THEN
    RAISE EXCEPTION 'Таблиця % не існує', table_name_param;
  END IF;

  -- Знаходимо primary key колонку
  SELECT ku.column_name INTO pk_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
  WHERE tc.constraint_type = 'PRIMARY KEY' 
    AND tc.table_name = table_name_param
    AND tc.table_schema = 'public'
  LIMIT 1;

  IF pk_column IS NULL THEN
    pk_column := 'id'; -- За замовчуванням
  END IF;

  -- Формування SQL запиту
  sql_query := format(
    'DELETE FROM %I WHERE %I = %L',
    table_name_param,
    pk_column,
    record_id
  );

  -- Виконання запиту
  EXECUTE sql_query;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN affected_rows > 0;
END;
$$;

-- 7. ФУНКЦІЯ ДЛЯ ОТРИМАННЯ ВСІХ ФУНКЦІЙ БД
CREATE OR REPLACE FUNCTION public.get_all_functions()
RETURNS TABLE (
  function_name TEXT,
  arguments TEXT,
  return_type TEXT,
  language TEXT,
  function_type TEXT,
  description TEXT,
  source_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::TEXT as function_name,
    pg_get_function_arguments(p.oid)::TEXT as arguments,
    pg_get_function_result(p.oid)::TEXT as return_type,
    l.lanname::TEXT as language,
    CASE 
      WHEN p.prokind = 'f' THEN 'function'
      WHEN p.prokind = 'p' THEN 'procedure'
      WHEN p.prokind = 'a' THEN 'aggregate'
      WHEN p.prokind = 'w' THEN 'window'
      ELSE 'unknown'
    END::TEXT as function_type,
    COALESCE(d.description, 'Немає опису')::TEXT as description,
    COALESCE(p.prosrc, 'Код недоступний')::TEXT as source_code
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_language l ON p.prolang = l.oid
  LEFT JOIN pg_description d ON d.objoid = p.oid
  WHERE n.nspname = 'public'
    AND l.lanname != 'c' -- Виключаємо C функції
  ORDER BY p.proname;
END;
$$;

-- 8. ФУНКЦІЯ ДЛЯ ОТРИМАННЯ ІНДЕКСІВ ТАБЛИЦІ
CREATE OR REPLACE FUNCTION public.get_table_indexes(table_name_param TEXT)
RETURNS TABLE (
  index_name TEXT,
  column_names TEXT,
  is_unique BOOLEAN,
  index_type TEXT,
  index_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.relname::TEXT as index_name,
    string_agg(a.attname, ', ' ORDER BY a.attnum)::TEXT as column_names,
    ix.indisunique as is_unique,
    am.amname::TEXT as index_type,
    pg_size_pretty(pg_relation_size(i.oid))::TEXT as index_size
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_am am ON i.relam = am.oid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE t.relname = table_name_param
    AND t.relkind = 'r'
    AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  GROUP BY i.relname, ix.indisunique, am.amname, i.oid
  ORDER BY i.relname;
END;
$$;

-- Права доступу для всіх функцій
GRANT EXECUTE ON FUNCTION public.get_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_structure(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_data(TEXT, INT, INT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_table_record(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_table_record(TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_table_record(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_functions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_indexes(TEXT) TO authenticated;

-- Логування
DO $$
BEGIN
  RAISE NOTICE '✅ Database Manager RPC функції створені успішно!';
  RAISE NOTICE '📊 Доступні функції:';
  RAISE NOTICE '   • get_all_tables() - список всіх таблиць';
  RAISE NOTICE '   • get_table_structure(table_name) - структура таблиці';
  RAISE NOTICE '   • get_table_data(...) - дані таблиці з пагінацією';
  RAISE NOTICE '   • insert_table_record(...) - вставка запису';
  RAISE NOTICE '   • update_table_record(...) - оновлення запису';
  RAISE NOTICE '   • delete_table_record(...) - видалення запису';
  RAISE NOTICE '   • get_all_functions() - список функцій БД';
  RAISE NOTICE '   • get_table_indexes(table_name) - індекси таблиці';
END $$;

SELECT 'Database Manager RPC функції створені успішно!' as result;