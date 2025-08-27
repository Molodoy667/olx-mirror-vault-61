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
      const { data, error } = await supabase
        .rpc('get_all_tables');

      if (error) {
        console.error('Помилка отримання таблиць:', error);
        throw new Error(`Помилка отримання таблиць: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Критична помилка getAllTables:', error);
      throw error;
    }
  },

  // Отримання структури таблиці
  async getTableStructure(tableName: string): Promise<ColumnInfo[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_table_structure', { table_name_param: tableName });

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
        .rpc('get_table_data', {
          table_name_param: tableName,
          page_number: page,
          page_size: pageSize,
          search_query: searchQuery,
          order_column: orderColumn,
          order_direction: orderDirection
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
      const { data, error } = await supabase
        .rpc('get_all_functions');

      if (error) {
        console.error('Помилка отримання функцій:', error);
        throw new Error(`Помилка отримання функцій: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Критична помилка getAllFunctions:', error);
      throw error;
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