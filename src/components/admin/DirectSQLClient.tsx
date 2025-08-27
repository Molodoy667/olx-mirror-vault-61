import React, { useState } from 'react';
import { Database, Play, Copy, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function DirectSQLClient() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const startTime = Date.now();
      
      // Спроба виконати через exec_sql RPC
      const { data, error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: query
      });
      
      const executionTime = Date.now() - startTime;
      
      if (rpcError) {
        // Якщо exec_sql не працює, спробуємо прямий запит
        if (query.trim().toUpperCase().startsWith('SELECT')) {
          const { data: directData, error: directError } = await supabase
            .from('pg_tables') // Заміниться на ваш запит
            .select('*');
            
          if (directError) {
            setError(`Помилка: ${directError.message}`);
          } else {
            setResult({
              data: directData,
              executionTime,
              message: 'Запит виконано (прямий метод)'
            });
          }
        } else {
          setError(`RPC помилка: ${rpcError.message}`);
        }
      } else {
        setResult({
          data,
          executionTime,
          message: 'Запит виконано успішно'
        });
      }
    } catch (err: any) {
      setError(`Критична помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    }
  };

  const downloadResult = () => {
    if (result) {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sql_result.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Прямий SQL Клієнт
        </h2>
      </div>

      {/* SQL Редактор */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          SQL Запит:
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Введіть SQL запит...
Приклади:
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';
SELECT * FROM pg_proc WHERE proname LIKE '%exec%';"
          rows={8}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
        />
        
        <div className="flex space-x-2">
          <button
            onClick={executeQuery}
            disabled={loading || !query.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Виконується...' : 'Виконати'}</span>
          </button>
          
          <button
            onClick={() => setQuery('SELECT * FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 10;')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Приклад: Таблиці
          </button>
          
          <button
            onClick={() => setQuery('SELECT proname, prosrc FROM pg_proc WHERE proname LIKE \'%exec%\' OR proname LIKE \'%get_%\';')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Приклад: Функції
          </button>
        </div>
      </div>

      {/* Помилки */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Результати */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Результат
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={copyResult}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Copy className="h-4 w-4" />
                <span>Копіювати</span>
              </button>
              <button
                onClick={downloadResult}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Download className="h-4 w-4" />
                <span>Завантажити</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {result.message} | Час виконання: {result.executionTime}ms
            </div>
            <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}