// Тестування автоматичного аналізу БД
import { createClient } from '@supabase/supabase-js';

// Використовуємо існуючі змінні оточення
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseAnalysis() {
  console.log('🔍 Початок аналізу БД...\n');

  try {
    // 1. Спробуємо RPC функцію (якщо вона існує)
    console.log('1️⃣ Тестуємо RPC функцію get_tables_info...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_tables_info');
    
    if (!rpcError && rpcData) {
      console.log('✅ RPC функція працює!');
      console.log(`📊 Знайдено ${rpcData.length} таблиць через RPC:`);
      rpcData.forEach(table => {
        console.log(`  📁 ${table.table_name} (${table.column_count} колонок, ~${table.estimated_rows} рядків)`);
      });
    } else {
      console.log('❌ RPC функція недоступна, використовуємо fallback...');
      console.log('Помилка RPC:', rpcError?.message);
      
      // 2. Fallback: тестуємо існування базових таблиць
      console.log('\n2️⃣ Fallback аналіз - перевіряємо базові таблиці...');
      const basicTables = ['profiles', 'listings', 'categories', 'favorites', 'messages', 'saved_searches'];
      const existingTables = [];
      
      for (const tableName of basicTables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          if (!error) {
            existingTables.push({ name: tableName, count: count || 0 });
            console.log(`  ✅ ${tableName} - ${count || 0} рядків`);
          }
        } catch (error) {
          console.log(`  ❌ ${tableName} - недоступна`);
        }
      }
      
      console.log(`\n📊 Fallback результат: ${existingTables.length} доступних таблиць`);
    }

    // 3. Тестуємо функцію exec_sql
    console.log('\n3️⃣ Тестуємо функцію exec_sql...');
    const { data: execData, error: execError } = await supabase.rpc('exec_sql', {
      sql_query: 'SELECT 1 as test_result'
    });
    
    if (execError) {
      console.log('❌ Функція exec_sql відсутня!');
      console.log('Помилка:', execError.message);
      return { needsExecFunction: true, tablesFound: rpcData?.length || existingTables.length };
    } else {
      console.log('✅ Функція exec_sql працює!');
      return { needsExecFunction: false, tablesFound: rpcData?.length || existingTables.length };
    }

  } catch (error) {
    console.error('❌ Критична помилка аналізу:', error);
    return { needsExecFunction: true, tablesFound: 0, error: error.message };
  }
}

// Виконуємо аналіз
testDatabaseAnalysis().then(result => {
  console.log('\n🎯 Результат аналізу:', result);
}).catch(error => {
  console.error('💥 Помилка:', error);
});