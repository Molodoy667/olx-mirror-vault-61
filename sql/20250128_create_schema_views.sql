-- Міграція: Створення зручних view для аналізу схеми БД
-- Дата: 2025-01-28
-- Автор: AI Assistant
-- Опис: Створює view для швидкого перегляду структури БД

-- 1. VIEW для швидкого перегляду таблиць та їх колонок
CREATE OR REPLACE VIEW public.v_schema_overview AS
SELECT 
  t.table_name as таблиця,
  count(c.column_name) as кількість_колонок,
  count(CASE WHEN c.is_nullable = 'NO' THEN 1 END) as обовязкових_колонок,
  count(CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN 1 END) as первинних_ключів,
  count(CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN 1 END) as зовнішніх_ключів,
  string_agg(DISTINCT tc.constraint_type, ', ') as типи_обмежень
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- 2. VIEW для детального перегляду колонок
CREATE OR REPLACE VIEW public.v_columns_detail AS
SELECT 
  c.table_name as таблиця,
  c.column_name as колонка,
  c.ordinal_position as позиція,
  c.data_type as тип,
  CASE 
    WHEN c.character_maximum_length IS NOT NULL THEN c.data_type || '(' || c.character_maximum_length || ')'
    WHEN c.numeric_precision IS NOT NULL THEN c.data_type || '(' || c.numeric_precision || ',' || COALESCE(c.numeric_scale, 0) || ')'
    ELSE c.data_type
  END as повний_тип,
  c.is_nullable as nullable,
  c.column_default as за_замовчуванням,
  COALESCE(tc.constraint_type, '') as обмеження
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 3. VIEW для зв'язків між таблицями
CREATE OR REPLACE VIEW public.v_foreign_keys AS
SELECT 
  tc.table_name as батьківська_таблиця,
  kcu.column_name as батьківська_колонка,
  ccu.table_name as дочірня_таблиця,
  ccu.column_name as дочірня_колонка,
  tc.constraint_name as назва_обмеження,
  rc.update_rule as при_оновленні,
  rc.delete_rule as при_видаленні
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. VIEW для статистики таблиць
CREATE OR REPLACE VIEW public.v_table_stats AS
SELECT 
  schemaname as схема,
  relname as таблиця,
  n_tup_ins as вставок,
  n_tup_upd as оновлень,
  n_tup_del as видалень,
  n_live_tup as живих_рядків,
  n_dead_tup as мертвих_рядків,
  last_vacuum as остання_очистка,
  last_autovacuum as остання_авто_очистка,
  last_analyze as останній_аналіз
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- 5. Функція для швидкого перегляду структури таблиці
CREATE OR REPLACE FUNCTION public.describe_table(table_name_param TEXT)
RETURNS TABLE (
  колонка TEXT,
  тип TEXT,
  nullable BOOLEAN,
  за_замовчуванням TEXT,
  обмеження TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    CASE 
      WHEN c.character_maximum_length IS NOT NULL THEN c.data_type || '(' || c.character_maximum_length || ')'
      WHEN c.numeric_precision IS NOT NULL THEN c.data_type || '(' || c.numeric_precision || ',' || COALESCE(c.numeric_scale, 0) || ')'
      ELSE c.data_type
    END::TEXT,
    CASE WHEN c.is_nullable = 'YES' THEN TRUE ELSE FALSE END,
    c.column_default::TEXT,
    COALESCE(tc.constraint_type, '')::TEXT
  FROM information_schema.columns c
  LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
  LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
  WHERE c.table_schema = 'public'
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END;
$$;

-- 6. Функція для перегляду зв'язків таблиці
CREATE OR REPLACE FUNCTION public.table_relationships(table_name_param TEXT)
RETURNS TABLE (
  тип_звязку TEXT,
  локальна_колонка TEXT,
  зовнішня_таблиця TEXT,
  зовнішня_колонка TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Зовнішні ключі (виходящі)
  RETURN QUERY
  SELECT 
    'FOREIGN KEY (виходящий)'::TEXT,
    kcu.column_name::TEXT,
    ccu.table_name::TEXT,
    ccu.column_name::TEXT
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = table_name_param;
    
  -- Зворотні зв'язки (вхідні)
  RETURN QUERY
  SELECT 
    'REFERENCED BY (вхідний)'::TEXT,
    ccu.column_name::TEXT,
    tc.table_name::TEXT,
    kcu.column_name::TEXT
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_name = table_name_param;
END;
$$;

-- Коментарі до створених об'єктів
COMMENT ON VIEW public.v_schema_overview IS 'Загальний огляд таблиць та їх характеристик';
COMMENT ON VIEW public.v_columns_detail IS 'Детальна інформація про всі колонки в базі';
COMMENT ON VIEW public.v_foreign_keys IS 'Зв'язки між таблицями (foreign keys)';
COMMENT ON VIEW public.v_table_stats IS 'Статистика використання таблиць';
COMMENT ON FUNCTION public.describe_table(TEXT) IS 'Функція для перегляду структури конкретної таблиці';
COMMENT ON FUNCTION public.table_relationships(TEXT) IS 'Функція для перегляду зв'язків конкретної таблиці';