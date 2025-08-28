// Тестовый файл для диагностики проблемы с exec_sql
import { supabase } from '@/integrations/supabase/client';
import { executeAlternativeSQL, checkSupabaseRPCCapabilities } from '@/lib/sql-alternative';

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Проверяем, что supabase импортируется корректно
    console.log('✅ Supabase client imported:', !!supabase);
    console.log('🔍 Supabase client keys:', Object.keys(supabase));
    
    // Проверяем, что rpc функция существует
    console.log('✅ supabase.rpc exists:', typeof supabase.rpc);
    
    // Проверяем базовое соединение
    const { data: connectionTest, error: connectionError } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
    
    console.log('✅ Basic connection test:', { data: connectionTest, error: connectionError });
    
    // Комплексная диагностика RPC возможностей
    console.log('🔍 Checking RPC capabilities...');
    const rpcCapabilities = await checkSupabaseRPCCapabilities();
    console.log('📊 RPC Capabilities:', rpcCapabilities);
    
    // Пытаемся вызвать exec_sql напрямую
    console.log('🔍 Testing exec_sql function directly...');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        query: 'SELECT 1 as test_value;' 
      });
      console.log('✅ Direct exec_sql result:', { data, error });
      
      if (error) {
        // Если exec_sql есть но выдает ошибку
        return { 
          success: false, 
          error: error,
          rpcCapabilities,
          message: `exec_sql функция найдена, но выдает ошибку: ${error.message}` 
        };
      } else {
        // Если exec_sql работает
        return { 
          success: true, 
          data, 
          rpcCapabilities,
          message: 'exec_sql функция работает корректно!' 
        };
      }
    } catch (rpcError: any) {
      console.error('❌ exec_sql error:', rpcError);
      
      // Пробуем альтернативный подход
      console.log('🔄 Trying alternative SQL execution...');
      const altResult = await executeAlternativeSQL('SELECT 1 as test_value');
      
      return { 
        success: false, 
        error: rpcError,
        rpcCapabilities,
        alternativeResult: altResult,
        message: `exec_sql недоступна: ${rpcError.message}. Альтернативный результат: ${altResult.success ? 'работает' : altResult.error}` 
      };
    }
    
  } catch (generalError: any) {
    console.error('❌ General error:', generalError);
    return { success: false, error: generalError, message: `Общая ошибка: ${generalError.message}` };
  }
}

export async function testAlternativeQuery() {
  try {
    console.log('🔍 Testing alternative query methods...');
    
    // Тестируем обычный запрос
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);
      
    console.log('✅ Standard query works:', { data, error });
    
    // Попробуем другие RPC функции, если они есть
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('test_function');
      console.log('🔍 Other RPC test:', { data: rpcData, error: rpcError });
    } catch (e) {
      console.log('ℹ️ No test_function available (expected)');
    }
    
    return { success: true, data, error };
  } catch (e) {
    console.error('❌ Alternative query error:', e);
    return { success: false, error: e };
  }
}