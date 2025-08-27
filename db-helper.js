// Database Helper Script
// Запуск: node db-helper.js

import { createClient } from '@supabase/supabase-js';

// ВНИМАНИЕ: Добавьте свои настройки Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Функция для выполнения SQL запросов
async function runSQL(query) {
  console.log('🔍 Выполняю запрос:', query);
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', { query });
    
    if (error) {
      console.error('❌ Ошибка:', error);
      return null;
    }
    
    console.log('✅ Результат:', data);
    return data;
  } catch (err) {
    console.error('💥 Исключение:', err);
    return null;
  }
}

// Быстрые функции для анализа данных
async function getTableStats() {
  const query = `
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_rows
    FROM pg_stat_user_tables 
    ORDER BY n_live_tup DESC;
  `;
  
  return await runSQL(query);
}

async function getTopUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌', error);
    return null;
  }
  
  console.log('👥 Топ пользователи:', data);
  return data;
}

async function getListingsStats() {
  const { data, error } = await supabase
    .from('listings')
    .select('status, count(*)')
    .group('status');
    
  if (error) {
    console.error('❌', error);
    return null;
  }
  
  console.log('📊 Статистика объявлений:', data);
  return data;
}

// Главная функция
async function main() {
  console.log('🚀 Подключение к базе данных...\n');
  
  // Проверка подключения
  const { data: connection } = await supabase.from('listings').select('count').limit(1);
  if (!connection) {
    console.error('❌ Не удалось подключиться к БД');
    return;
  }
  
  console.log('✅ Подключение успешно!\n');
  
  console.log('📊 СТАТИСТИКА ТАБЛИЦ:');
  await getTableStats();
  
  console.log('\n👥 ТОП ПОЛЬЗОВАТЕЛИ:');
  await getTopUsers();
  
  console.log('\n📋 СТАТИСТИКА ОБЪЯВЛЕНИЙ:');
  await getListingsStats();
}

// Запуск
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runSQL, getTableStats, getTopUsers, getListingsStats };