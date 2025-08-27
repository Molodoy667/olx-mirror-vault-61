-- Повний аналіз структури БД
-- Виконайте цей запит для детального огляду вашої бази даних

-- 1. ЗАГАЛЬНА СТАТИСТИКА БД
SELECT '🎯 ЗАГАЛЬНА СТАТИСТИКА БД' as info;

SELECT 
  'Таблиці' as тип_обєкту,
  count(*) as кількість
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'View' as тип_обєкту,
  count(*) as кількість
FROM pg_views 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Функції' as тип_обєкту,
  count(*) as кількість
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prokind = 'f'

UNION ALL

SELECT 
  'Індекси' as тип_обєкту,
  count(*) as кількість
FROM pg_indexes 
WHERE schemaname = 'public';

-- 2. ДЕТАЛЬНИЙ СПИСОК ТАБЛИЦЬ З КОЛОНКАМИ
SELECT '📊 ТАБЛИЦІ ТА ЇХ СТРУКТУРА' as info;

SELECT 
  t.tablename as "🏗️ Таблиця",
  (
    SELECT count(*) 
    FROM information_schema.columns c 
    WHERE c.table_name = t.tablename AND c.table_schema = 'public'
  ) as "📋 Колонок",
  COALESCE(s.n_live_tup, 0) as "📊 Рядків",
  pg_size_pretty(pg_total_relation_size('public.'||t.tablename)) as "💾 Розмір",
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.table_constraints tc 
      WHERE tc.table_name = t.tablename 
        AND tc.table_schema = 'public' 
        AND tc.constraint_type = 'PRIMARY KEY'
    ) THEN '✅' 
    ELSE '❌' 
  END as "🔑 PK",
  (
    SELECT count(*) 
    FROM information_schema.table_constraints tc 
    WHERE tc.table_name = t.tablename 
      AND tc.table_schema = 'public' 
      AND tc.constraint_type = 'FOREIGN KEY'
  ) as "🔗 FK",
  (
    SELECT count(*) 
    FROM pg_indexes i 
    WHERE i.tablename = t.tablename AND i.schemaname = 'public'
  ) as "⚡ Індексів"
FROM pg_tables t
LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
WHERE t.schemaname = 'public'
ORDER BY s.n_live_tup DESC NULLS LAST, t.tablename;

-- 3. ТОП-5 НАЙБІЛЬШИХ ТАБЛИЦЬ
SELECT '🏆 ТОП-5 НАЙБІЛЬШИХ ТАБЛИЦЬ' as info;

SELECT 
  schemaname as схема,
  tablename as "📁 Таблиця",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "💾 Загальний розмір",
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "📊 Розмір даних",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as "⚡ Розмір індексів"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 5;

-- 4. КОЛОНКИ ВСІХ ТАБЛИЦЬ
SELECT '📋 ДЕТАЛЬНА СТРУКТУРА КОЛОНОК' as info;

SELECT 
  table_name as "🏗️ Таблиця",
  column_name as "📝 Колонка",
  ordinal_position as "📊 №",
  CASE 
    WHEN character_maximum_length IS NOT NULL THEN data_type || '(' || character_maximum_length || ')'
    WHEN numeric_precision IS NOT NULL THEN data_type || '(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
    ELSE data_type
  END as "📊 Тип",
  CASE WHEN is_nullable = 'YES' THEN '✅' ELSE '❌' END as "❓ NULL",
  COALESCE(column_default, '') as "🔧 За замовчуванням",
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = c.table_name 
        AND tc.constraint_type = 'PRIMARY KEY'
        AND kcu.column_name = c.column_name
    ) THEN '🔑 PK'
    WHEN EXISTS(
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = c.table_name 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = c.column_name
    ) THEN '🔗 FK'
    ELSE ''
  END as "🏷️ Ключ"
FROM information_schema.columns c
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 5. FOREIGN KEY ЗВ'ЯЗКИ
SELECT '🔗 ЗОВНІШНІ КЛЮЧІ (FOREIGN KEYS)' as info;

SELECT 
  tc.table_name as "📝 Таблиця",
  kcu.column_name as "📋 Колонка",
  ccu.table_name as "🎯 Посилається на таблицю",
  ccu.column_name as "🎯 Посилається на колонку",
  tc.constraint_name as "🏷️ Назва обмеження"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 6. ІНДЕКСИ
SELECT '⚡ ІНДЕКСИ ТАБЛИЦЬ' as info;

SELECT 
  schemaname as схема,
  tablename as "📁 Таблиця",
  indexname as "⚡ Назва індексу",
  CASE WHEN indexdef LIKE '%UNIQUE%' THEN '✅ Унікальний' ELSE '📊 Звичайний' END as "🏷️ Тип",
  indexdef as "🔧 Визначення"
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. ФУНКЦІЇ В БД
SELECT '⚙️ ФУНКЦІЇ БАЗИ ДАНИХ' as info;

SELECT 
  p.proname as "⚙️ Назва функції",
  pg_get_function_arguments(p.oid) as "📋 Аргументи",
  pg_get_function_result(p.oid) as "📤 Повертає",
  l.lanname as "🌐 Мова"
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public' AND p.prokind = 'f'
ORDER BY p.proname;

-- 8. ENUM ТИПИ
SELECT '📂 ENUM ТИПИ' as info;

SELECT 
  t.typname as "📂 Назва ENUM",
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as "📋 Значення"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- 9. ПРОБЛЕМИ ТА РЕКОМЕНДАЦІЇ
SELECT '💡 РЕКОМЕНДАЦІЇ ДЛЯ ОПТИМІЗАЦІЇ' as info;

-- Таблиці без Primary Key
SELECT 
  'Таблиця без Primary Key: ' || tablename as "⚠️ Проблема",
  'Додайте PRIMARY KEY для таблиці ' || tablename as "💡 Рекомендація"
FROM pg_tables t
WHERE schemaname = 'public'
  AND NOT EXISTS(
    SELECT 1 FROM information_schema.table_constraints tc 
    WHERE tc.table_name = t.tablename 
      AND tc.table_schema = 'public' 
      AND tc.constraint_type = 'PRIMARY KEY'
  )

UNION ALL

-- Таблиці без індексів
SELECT 
  'Таблиця без індексів: ' || tablename as "⚠️ Проблема",
  'Розгляньте додавання індексів для ' || tablename as "💡 Рекомендація"
FROM pg_tables t
WHERE schemaname = 'public'
  AND NOT EXISTS(
    SELECT 1 FROM pg_indexes i 
    WHERE i.tablename = t.tablename AND i.schemaname = 'public'
  )

UNION ALL

-- Великі таблиці (якщо є статистика)
SELECT 
  'Велика таблиця: ' || relname || ' (' || n_live_tup || ' рядків)' as "⚠️ Проблема",
  'Розгляньте партиціювання або архівацію для ' || relname as "💡 Рекомендація"
FROM pg_stat_user_tables 
WHERE n_live_tup > 10000

UNION ALL

SELECT 
  'Аналіз завершено!' as "✅ Статус",
  'База даних проаналізована успішно' as "🎯 Результат";

-- 10. ПІДСУМОК
SELECT '🎯 ПІДСУМОК АНАЛІЗУ' as info;

SELECT 
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') as "📁 Всього таблиць",
  (SELECT sum(COALESCE(n_live_tup, 0)) FROM pg_stat_user_tables) as "📊 Всього рядків у БД",
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public') as "📋 Всього колонок",
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') as "⚡ Всього індексів",
  pg_size_pretty(pg_database_size(current_database())) as "💾 Розмір БД";