import { supabase } from '@/integrations/supabase/client';

// Типи для Database Manager
export interface TableInfo {
  table_name: string;
  row_count: number;
  table_size: string;
  description: string;
}

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_table: string;
  foreign_column: string;
}

export interface TableData {
  data: any[];
  total_count: number;
  page_count: number;
}

export interface FunctionInfo {
  function_name: string;
  arguments: string;
  return_type: string;
  language: string;
  function_type: string;
  description: string;
  source_code: string;
}

export interface IndexInfo {
  index_name: string;
  column_names: string;
  is_unique: boolean;
  index_type: string;
  index_size: string;
}

// API для Database Manager
export const databaseManager = {
  // Отримання списку всіх таблиць
  async getAllTables(): Promise<TableInfo[]> {
    try {
      // Спочатку пробуємо спрощену RPC функцію
      const { data, error } = await supabase
        .rpc('get_simple_tables');

      if (error) {
        console.warn('RPC get_simple_tables недоступна, використовуємо fallback:', error.message);
        
        // Fallback: використовуємо information_schema замість pg_tables
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');

        if (fallbackError) {
          console.error('Fallback також не працює:', fallbackError);
          throw new Error(`Помилка отримання таблиць: ${fallbackError.message}`);
        }

        // Перетворюємо fallback дані в потрібний формат
        return (fallbackData || []).map(table => ({
          table_name: table.table_name,
          row_count: 0,
          table_size: 'Невідомо',
          description: 'Базова інформація (RPC недоступна)'
        }));
      }

      return data || [];
    } catch (error) {
      console.error('Критична помилка getAllTables:', error);
      // Останній fallback - повертаємо пусту таблицю з повідомленням
      return [{
        table_name: 'ERROR',
        row_count: 0,
        table_size: '0 B',
        description: `Помилка завантаження: ${error}`
      }];
    }
  },

  // Отримання структури таблиці
  async getTableStructure(tableName: string): Promise<ColumnInfo[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_simple_structure', { table_name_param: tableName });

      if (error) {
        console.error('Помилка отримання структури таблиці:', error);
        throw new Error(`Помилка отримання структури: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Критична помилка getTableStructure:', error);
      throw error;
    }
  },

  // Отримання даних таблиці з пагінацією
  async getTableData(
    tableName: string,
    page: number = 1,
    pageSize: number = 50,
    searchQuery: string = '',
    orderColumn: string = '',
    orderDirection: 'ASC' | 'DESC' = 'ASC'
  ): Promise<TableData> {
    try {
      const { data, error } = await supabase
        .rpc('get_simple_data', {
          table_name_param: tableName,
          page_number: page,
          page_size: pageSize
        });

      if (error) {
        console.error('Помилка отримання даних таблиці:', error);
        throw new Error(`Помилка отримання даних: ${error.message}`);
      }

      const result = data?.[0];
      return {
        data: result?.data || [],
        total_count: result?.total_count || 0,
        page_count: result?.page_count || 0
      };
    } catch (error) {
      console.error('Критична помилка getTableData:', error);
      throw error;
    }
  },

  // Вставка нового запису
  async insertRecord(tableName: string, recordData: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('insert_table_record', {
          table_name_param: tableName,
          record_data: recordData
        });

      if (error) {
        console.error('Помилка вставки запису:', error);
        throw new Error(`Помилка вставки: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Критична помилка insertRecord:', error);
      throw error;
    }
  },

  // Оновлення запису
  async updateRecord(tableName: string, recordId: string, recordData: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('update_table_record', {
          table_name_param: tableName,
          record_id: recordId,
          record_data: recordData
        });

      if (error) {
        console.error('Помилка оновлення запису:', error);
        throw new Error(`Помилка оновлення: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Критична помилка updateRecord:', error);
      throw error;
    }
  },

  // Видалення запису
  async deleteRecord(tableName: string, recordId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('delete_table_record', {
          table_name_param: tableName,
          record_id: recordId
        });

      if (error) {
        console.error('Помилка видалення запису:', error);
        throw new Error(`Помилка видалення: ${error.message}`);
      }

      return data || false;
    } catch (error) {
      console.error('Критична помилка deleteRecord:', error);
      throw error;
    }
  },

  // Отримання всіх функцій БД
  async getAllFunctions(): Promise<FunctionInfo[]> {
    try {
      // Використовуємо exec_sql для отримання функцій
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          SELECT 
            p.proname as function_name,
            CASE p.prokind 
              WHEN 'f' THEN 'function'
              WHEN 'p' THEN 'procedure'
              WHEN 'a' THEN 'aggregate'
              WHEN 'w' THEN 'window'
              ELSE 'unknown'
            END as function_type,
            pg_get_function_result(p.oid) as return_type,
            pg_get_function_arguments(p.oid) as arguments,
            l.lanname as language,
            pg_get_functiondef(p.oid) as source_code,
            r.rolname as owner,
            obj_description(p.oid, 'pg_proc') as description
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          JOIN pg_language l ON p.prolang = l.oid
          JOIN pg_roles r ON p.proowner = r.oid
          WHERE n.nspname = 'public'
          AND p.prokind IN ('f', 'p')
          ORDER BY p.proname;
        `
      });

      if (error) {
        console.error('Помилка отримання функцій через exec_sql:', error);
        return [];
      }

      // Обрабатываем результат exec_sql
      const functionsData = Array.isArray(data) ? data : (data?.result || []);
      
      return functionsData.map((func: any) => ({
        function_name: func.function_name || 'Unknown',
        function_type: func.function_type || 'function',
        return_type: func.return_type || 'void',
        arguments: func.arguments || '',
        language: func.language || 'sql',
        source_code: func.source_code || 'Код недоступний',
        owner: func.owner || 'public',
        description: func.description || `${func.function_type}: ${func.function_name}`
      }));

    } catch (error) {
      console.error('Критична помилка getAllFunctions:', error);
      // Повертаємо помилку як єдину функцію для відображення
      return [{
        function_name: 'ERROR',
        function_type: 'error',
        return_type: 'void',
        arguments: '',
        language: 'unknown',
        source_code: `Помилка завантаження функцій: ${error}`,
        owner: 'system',
        description: 'Функції недоступні'
      }];
    }
  },

  // Отримання індексів таблиці
  async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_table_indexes', { table_name_param: tableName });

      if (error) {
        console.error('Помилка отримання індексів:', error);
        throw new Error(`Помилка отримання індексів: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Критична помилка getTableIndexes:', error);
      throw error;
    }
  }
};