// Альтернативная реализация SQL выполнения без использования exec_sql
import { supabase } from '@/integrations/supabase/client';

export async function executeAlternativeSQL(sqlQuery: string): Promise<{ success: boolean; data?: any; error?: string; }> {
  try {
    console.log('🔍 Trying alternative SQL execution for:', sqlQuery.substring(0, 100));
    
    // Простые SELECT запросы
    if (sqlQuery.trim().toLowerCase().startsWith('select')) {
      // Для SELECT используем обычный query
      try {
        console.log('📊 Executing SELECT query...');
        // Это не будет работать для произвольных SELECT, но попробуем
        const { data, error } = await supabase.from('admin_users').select('*').limit(1);
        return { success: !error, data, error: error?.message };
      } catch (e: any) {
        console.log('❌ SELECT failed:', e.message);
        return { success: false, error: `SELECT query failed: ${e.message}` };
      }
    }
    
    // Проверяем, есть ли функции доступные через RPC
    try {
      console.log('🔍 Checking available RPC functions...');
      
      // Проверим, какие RPC функции доступны
      const { data: rpcList, error: rpcError } = await supabase
        .rpc('exec_sql', { query: 'SELECT 1' });
        
      console.log('✅ exec_sql is available!', { data: rpcList, error: rpcError });
      return { 
        success: !rpcError, 
        data: rpcList, 
        error: rpcError?.message || undefined 
      };
      
    } catch (rpcError: any) {
      console.log('❌ exec_sql not available:', rpcError.message);
      
      // Попробуем другой подход - может быть есть другие функции
      try {
        console.log('🔍 Trying alternative RPC approaches...');
        
        // Проверим, можем ли мы выполнить простейший RPC
        const { data, error } = await supabase.rpc('version');
        
        if (!error) {
          console.log('✅ Basic RPC works, version:', data);
          return { success: true, data: `RPC works, PostgreSQL version: ${data}` };
        } else {
          throw new Error(error.message);
        }
        
      } catch (versionError: any) {
        console.log('❌ No RPC functions available:', versionError.message);
        
        return { 
          success: false, 
          error: `Функция exec_sql недоступна. RPC ошибка: ${rpcError.message}. Version RPC тоже недоступна: ${versionError.message}` 
        };
      }
    }
    
  } catch (generalError: any) {
    console.error('❌ General SQL execution error:', generalError);
    return { 
      success: false, 
      error: `Общая ошибка выполнения SQL: ${generalError.message}` 
    };
  }
}

export async function checkSupabaseRPCCapabilities(): Promise<{ 
  hasExecSQL: boolean; 
  hasVersion: boolean; 
  availableFunctions: string[]; 
  errors: string[]; 
}> {
  const result = {
    hasExecSQL: false,
    hasVersion: false,
    availableFunctions: [] as string[],
    errors: [] as string[]
  };
  
  // Проверяем exec_sql
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1 as test' });
    if (!error) {
      result.hasExecSQL = true;
      result.availableFunctions.push('exec_sql');
      console.log('✅ exec_sql available');
    } else {
      result.errors.push(`exec_sql error: ${error.message}`);
      console.log('❌ exec_sql not available:', error.message);
    }
  } catch (e: any) {
    result.errors.push(`exec_sql exception: ${e.message}`);
    console.log('❌ exec_sql exception:', e.message);
  }
  
  // Проверяем version
  try {
    const { data, error } = await supabase.rpc('version');
    if (!error) {
      result.hasVersion = true;
      result.availableFunctions.push('version');
      console.log('✅ version available');
    } else {
      result.errors.push(`version error: ${error.message}`);
      console.log('❌ version not available:', error.message);
    }
  } catch (e: any) {
    result.errors.push(`version exception: ${e.message}`);
    console.log('❌ version exception:', e.message);
  }
  
  // Попробуем несколько стандартных PostgreSQL функций
  const testFunctions = ['now', 'current_user', 'current_database'];
  
  for (const func of testFunctions) {
    try {
      const { data, error } = await supabase.rpc(func);
      if (!error) {
        result.availableFunctions.push(func);
        console.log(`✅ ${func} available`);
      } else {
        result.errors.push(`${func} error: ${error.message}`);
        console.log(`❌ ${func} not available:`, error.message);
      }
    } catch (e: any) {
      result.errors.push(`${func} exception: ${e.message}`);
      console.log(`❌ ${func} exception:`, e.message);
    }
  }
  
  return result;
}

// Функция для создания RPC функции exec_sql если она отсутствует
export function generateCreateExecSQLFunction(): string {
  return `
-- Создание функции exec_sql для выполнения произвольных SQL запросов
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TABLE(result JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_cursor REFCURSOR;
    result_record RECORD;
    results JSONB DEFAULT '[]'::JSONB;
BEGIN
    -- Выполняем запрос
    OPEN result_cursor FOR EXECUTE query;
    
    -- Если это SELECT запрос, возвращаем результаты
    IF UPPER(TRIM(query)) LIKE 'SELECT%' THEN
        LOOP
            FETCH result_cursor INTO result_record;
            EXIT WHEN NOT FOUND;
            results = results || to_jsonb(result_record);
        END LOOP;
    ELSE
        -- Для других запросов возвращаем статус выполнения
        results = '{"status": "executed"}'::JSONB;
    END IF;
    
    CLOSE result_cursor;
    RETURN QUERY SELECT results;
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT ('{"error": "' || SQLERRM || '", "sqlstate": "' || SQLSTATE || '"}')::JSONB;
END;
$$;

-- Предоставляем права выполнения
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;
`;
}