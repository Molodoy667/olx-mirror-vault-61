-- Функция для выполнения SQL запросов через API
-- ВНИМАНИЕ: Используйте только для административных целей!

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  affected_rows INTEGER;
BEGIN
  -- Проверяем, что пользователь является администратором
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Проверяем, что запрос не содержит опасных операций
  IF (
    LOWER(sql_query) LIKE '%drop%' OR
    LOWER(sql_query) LIKE '%delete from%' OR
    LOWER(sql_query) LIKE '%truncate%' OR
    LOWER(sql_query) LIKE '%alter table%' OR
    LOWER(sql_query) LIKE '%create table%' OR
    LOWER(sql_query) LIKE '%create index%' OR
    LOWER(sql_query) LIKE '%grant%' OR
    LOWER(sql_query) LIKE '%revoke%'
  ) THEN
    RAISE EXCEPTION 'Access denied: Dangerous SQL operation detected';
  END IF;

  -- Выполняем запрос
  EXECUTE sql_query;
  
  -- Получаем количество затронутых строк
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Формируем результат
  result := jsonb_build_object(
    'success', true,
    'message', 'SQL executed successfully',
    'affected_rows', affected_rows,
    'timestamp', NOW()
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Возвращаем ошибку
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'timestamp', NOW()
    );
    
    RETURN result;
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION exec_sql(TEXT) IS 'Execute SQL queries with admin privileges. Use with caution!';

-- Предоставляем доступ к функции
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;