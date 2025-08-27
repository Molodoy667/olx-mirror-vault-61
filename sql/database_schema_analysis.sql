-- Аналіз схеми бази даних
-- Цей запит покаже всі таблиці, колонки та їх типи

-- 1. ЗАГАЛЬНА ІНФОРМАЦІЯ ПРО ТАБЛИЦІ
SELECT 
  schemaname as схема,
  tablename as назва_таблиці,
  tableowner as власник,
  tablespace as табличний_простір,
  hasindexes as має_індекси,
  hasrules as має_правила,
  hastriggers as має_тригери
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. ДЕТАЛЬНА ІНФОРМАЦІЯ ПРО КОЛОНКИ
SELECT 
  t.table_name as таблиця,
  c.column_name as колонка,
  c.data_type as тип_даних,
  c.character_maximum_length as макс_довжина,
  c.is_nullable as може_бути_null,
  c.column_default as значення_за_замовчуванням,
  CASE 
    WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PRIMARY KEY'
    WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FOREIGN KEY'
    WHEN tc.constraint_type = 'UNIQUE' THEN 'UNIQUE'
    WHEN tc.constraint_type = 'CHECK' THEN 'CHECK'
    ELSE NULL
  END as обмеження
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 3. FOREIGN KEY ЗАВИСНОСТІ
SELECT 
  tc.table_name as таблиця,
  kcu.column_name as колонка,
  ccu.table_name as зовнішня_таблиця,
  ccu.column_name as зовнішня_колонка,
  tc.constraint_name as назва_обмеження
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 4. ІНДЕКСИ НА ТАБЛИЦЯХ
SELECT 
  schemaname as схема,
  tablename as таблиця,
  indexname as назва_індексу,
  indexdef as визначення_індексу
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. РОЗМІР ТАБЛИЦЬ (приблизний)
SELECT 
  schemaname as схема,
  tablename as таблиця,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as розмір,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as розмір_даних,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as розмір_індексів
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 6. ФУНКЦІЇ ТА ТРИГЕРИ
SELECT 
  n.nspname as схема,
  p.proname as назва_функції,
  pg_get_function_result(p.oid) as повертає,
  pg_get_function_arguments(p.oid) as аргументи,
  l.lanname as мова
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 7. ЕНУМИ (ENUM ТИПИ)
SELECT 
  t.typname as назва_типу,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as значення
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;