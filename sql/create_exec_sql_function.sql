-- 🔧 СТВОРЕННЯ ФУНКЦІЇ EXEC_SQL
-- Функція для виконання довільних SQL запитів через Supabase RPC

-- 1. Створення функції exec_sql
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TABLE(
    result JSONB,
    rows_affected INTEGER,
    execution_time_ms INTEGER,
    query_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_ms INTEGER;
    query_upper TEXT;
    affected_rows INTEGER := 0;
    result_data JSONB := '[]'::JSONB;
    single_result JSONB;
    rec RECORD;
BEGIN
    -- Записуємо час початку
    start_time := clock_timestamp();
    
    -- Визначаємо тип запиту
    query_upper := UPPER(TRIM(query));
    
    -- Логування запиту (тільки для адміністраторів)
    IF auth.uid() IN (SELECT user_id FROM public.admin_users) THEN
        RAISE NOTICE 'Executing SQL: %', LEFT(query, 100);
    END IF;
    
    -- Виконуємо запит в залежності від типу
    IF query_upper LIKE 'SELECT%' THEN
        -- SELECT запити - повертаємо результати
        FOR rec IN EXECUTE query LOOP
            single_result := to_jsonb(rec);
            result_data := result_data || single_result;
            affected_rows := affected_rows + 1;
        END LOOP;
        
        -- Записуємо час виконання
        end_time := clock_timestamp();
        execution_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        RETURN QUERY SELECT 
            result_data,
            affected_rows,
            execution_ms,
            'SELECT'::TEXT;
            
    ELSIF query_upper LIKE 'INSERT%' OR query_upper LIKE 'UPDATE%' OR query_upper LIKE 'DELETE%' THEN
        -- DML запити - повертаємо кількість змінених рядків
        EXECUTE query;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        
        end_time := clock_timestamp();
        execution_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        RETURN QUERY SELECT 
            jsonb_build_object(
                'status', 'success',
                'message', format('%s виконано успішно', 
                    CASE 
                        WHEN query_upper LIKE 'INSERT%' THEN 'INSERT'
                        WHEN query_upper LIKE 'UPDATE%' THEN 'UPDATE'
                        WHEN query_upper LIKE 'DELETE%' THEN 'DELETE'
                    END),
                'rows_affected', affected_rows
            ),
            affected_rows,
            execution_ms,
            CASE 
                WHEN query_upper LIKE 'INSERT%' THEN 'INSERT'
                WHEN query_upper LIKE 'UPDATE%' THEN 'UPDATE'
                WHEN query_upper LIKE 'DELETE%' THEN 'DELETE'
            END::TEXT;
            
    ELSIF query_upper LIKE 'CREATE%' OR query_upper LIKE 'DROP%' OR query_upper LIKE 'ALTER%' THEN
        -- DDL запити - структурні зміни
        EXECUTE query;
        
        end_time := clock_timestamp();
        execution_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        RETURN QUERY SELECT 
            jsonb_build_object(
                'status', 'success',
                'message', format('%s виконано успішно', 
                    CASE 
                        WHEN query_upper LIKE 'CREATE%' THEN 'CREATE'
                        WHEN query_upper LIKE 'DROP%' THEN 'DROP'
                        WHEN query_upper LIKE 'ALTER%' THEN 'ALTER'
                    END),
                'type', 'DDL'
            ),
            0,
            execution_ms,
            CASE 
                WHEN query_upper LIKE 'CREATE%' THEN 'CREATE'
                WHEN query_upper LIKE 'DROP%' THEN 'DROP'
                WHEN query_upper LIKE 'ALTER%' THEN 'ALTER'
            END::TEXT;
            
    ELSE
        -- Інші запити (SHOW, EXPLAIN, тощо)
        FOR rec IN EXECUTE query LOOP
            single_result := to_jsonb(rec);
            result_data := result_data || single_result;
            affected_rows := affected_rows + 1;
        END LOOP;
        
        end_time := clock_timestamp();
        execution_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        RETURN QUERY SELECT 
            result_data,
            affected_rows,
            execution_ms,
            'OTHER'::TEXT;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Обробка помилок
        end_time := clock_timestamp();
        execution_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
        
        RETURN QUERY SELECT 
            jsonb_build_object(
                'status', 'error',
                'error', SQLERRM,
                'sqlstate', SQLSTATE,
                'query', LEFT(query, 200),
                'hint', 'Перевірте синтаксис SQL запиту'
            ),
            0,
            execution_ms,
            'ERROR'::TEXT;
END;
$$;

-- 2. Створення спрощеної версії exec_sql (для зворотної сумісності)
CREATE OR REPLACE FUNCTION exec_sql_simple(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_data JSONB := '[]'::JSONB;
    single_result JSONB;
    rec RECORD;
    affected_rows INTEGER := 0;
BEGIN
    -- Тільки для адміністраторів
    IF NOT (auth.uid() IN (SELECT user_id FROM public.admin_users)) THEN
        RETURN jsonb_build_object('error', 'Доступ заборонено. Тільки для адміністраторів.');
    END IF;
    
    -- Виконуємо запит
    IF UPPER(TRIM(query)) LIKE 'SELECT%' THEN
        FOR rec IN EXECUTE query LOOP
            single_result := to_jsonb(rec);
            result_data := result_data || single_result;
        END LOOP;
        RETURN result_data;
    ELSE
        EXECUTE query;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RETURN jsonb_build_object(
            'status', 'success',
            'rows_affected', affected_rows,
            'message', 'Запит виконано успішно'
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- 3. Налаштування безпеки та прав доступу

-- Дозволяємо виконання тільки адміністраторам
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql_simple(TEXT) FROM PUBLIC;

-- Надаємо права тільки автентифікованим користувачам
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql_simple(TEXT) TO authenticated;

-- 4. Створення логування виконання SQL (опціонально)
CREATE TABLE IF NOT EXISTS sql_execution_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    query_type TEXT,
    execution_time_ms INTEGER,
    rows_affected INTEGER,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS для логування
ALTER TABLE sql_execution_log ENABLE ROW LEVEL SECURITY;

-- Тільки адміністратори можуть бачити логи
CREATE POLICY "Admins can view sql execution logs" ON sql_execution_log
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Всі автентифіковані користувачі можуть записувати свої логи
CREATE POLICY "Users can insert own sql logs" ON sql_execution_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Функція для логування (викликається автоматично)
CREATE OR REPLACE FUNCTION log_sql_execution(
    p_query TEXT,
    p_query_type TEXT,
    p_execution_time INTEGER,
    p_rows_affected INTEGER,
    p_status TEXT DEFAULT 'success',
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sql_execution_log (
        user_id,
        query_text,
        query_type,
        execution_time_ms,
        rows_affected,
        status,
        error_message,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        LEFT(p_query, 1000), -- Обмежуємо довжину
        p_query_type,
        p_execution_time,
        p_rows_affected,
        p_status,
        p_error_message,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Ігноруємо помилки логування
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Тестування функції
DO $$
DECLARE
    test_result JSONB;
BEGIN
    -- Тест SELECT запиту
    SELECT result INTO test_result 
    FROM exec_sql('SELECT 1 as test_value, ''Hello Novado'' as message') 
    LIMIT 1;
    
    RAISE NOTICE 'Test exec_sql result: %', test_result;
    
    -- Тест простої версії
    SELECT exec_sql_simple('SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = ''public''') INTO test_result;
    
    RAISE NOTICE 'Test exec_sql_simple result: %', test_result;
END $$;

-- 7. Надання прав на логування
GRANT EXECUTE ON FUNCTION log_sql_execution(TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;

SELECT 'Функція exec_sql створена успішно! ✅' as status,
       'Тепер SQL Manager працюватиме коректно! 🚀' as message;