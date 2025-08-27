// Database Analyzer - автоматичний аналіз БД через Supabase
import { supabase } from '@/integrations/supabase/client';

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  constraints: ConstraintInfo[];
  indexes: IndexInfo[];
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable?: string;
  foreignColumn?: string;
}

export interface ConstraintInfo {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
  definition: string;
}

export interface DatabaseSchema {
  tables: TableInfo[];
  functions: FunctionInfo[];
  enums: EnumInfo[];
  totalTables: number;
  lastAnalyzed: string;
}

export interface FunctionInfo {
  name: string;
  arguments: string;
  returnType: string;
  language: string;
}

export interface EnumInfo {
  name: string;
  values: string[];
}

// Основна функція аналізу БД
export async function analyzeDatabaseSchema(): Promise<DatabaseSchema> {
  console.log('🔍 Починаю аналіз схеми БД...');
  
  try {
    const [tables, functions, enums] = await Promise.all([
      getAllTables(),
      getAllFunctions(),
      getAllEnums()
    ]);

    const schema: DatabaseSchema = {
      tables,
      functions,
      enums,
      totalTables: tables.length,
      lastAnalyzed: new Date().toISOString()
    };

    console.log(`✅ Аналіз завершено: ${tables.length} таблиць знайдено`);
    return schema;
  } catch (error) {
    console.error('❌ Помилка аналізу БД:', error);
    throw error;
  }
}

// Отримати всі таблиці
async function getAllTables(): Promise<TableInfo[]> {
  try {
    // Спробуємо використати RPC функцію
    const { data: tablesData, error: tablesError } = await supabase.rpc('get_tables_info');
    
    if (!tablesError && tablesData) {
      // Конвертуємо дані з RPC в наш формат
      const tables: TableInfo[] = [];
      for (const tableInfo of tablesData) {
        const table: TableInfo = {
          name: tableInfo.table_name,
          columns: await getTableColumns(tableInfo.table_name),
          constraints: await getTableConstraints(tableInfo.table_name),
          indexes: await getTableIndexes(tableInfo.table_name),
          rowCount: tableInfo.estimated_rows
        };
        tables.push(table);
      }
      return tables;
    }
  } catch (error) {
    console.warn('RPC функція недоступна, використовую fallback');
  }
  
  // Fallback: використовуємо базовий аналіз
  return await getFallbackTables();
}

// Fallback функція для отримання таблиць
async function getFallbackTables(): Promise<TableInfo[]> {
  // Симулюємо базовий аналіз без прямого доступу до information_schema
  const basicTables = [
    'profiles', 'listings', 'categories', 'favorites', 'messages', 
    'listing_likes', 'listing_stats', 'saved_searches', 'notifications'
  ];
  
  const tables: TableInfo[] = [];
  
  for (const tableName of basicTables) {
    try {
      // Перевіряємо чи існує таблиця через простий запит
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
        
      if (!error) {
        // Таблиця існує, додаємо базову інформацію
        const table: TableInfo = {
          name: tableName,
          columns: await getFallbackColumns(tableName),
          constraints: [],
          indexes: [],
          rowCount: await getFallbackRowCount(tableName)
        };
        tables.push(table);
      }
    } catch (error) {
      // Таблиця не існує або немає доступу
      console.log(`Таблиця ${tableName} недоступна`);
    }
  }
  
  return tables;
}

// Fallback для колонок
async function getFallbackColumns(tableName: string): Promise<ColumnInfo[]> {
  // Базові колонки для типових таблиць
  const commonColumns: { [key: string]: ColumnInfo[] } = {
    profiles: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
      { name: 'email', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
      { name: 'created_at', type: 'timestamptz', nullable: false, isPrimaryKey: false, isForeignKey: false }
    ],
    listings: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
      { name: 'title', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
      { name: 'description', type: 'text', nullable: true, isPrimaryKey: false, isForeignKey: false },
      { name: 'price', type: 'numeric', nullable: true, isPrimaryKey: false, isForeignKey: false },
      { name: 'user_id', type: 'uuid', nullable: false, isPrimaryKey: false, isForeignKey: true, foreignTable: 'profiles', foreignColumn: 'id' },
      { name: 'category_id', type: 'uuid', nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: 'categories', foreignColumn: 'id' },
      { name: 'status', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
      { name: 'created_at', type: 'timestamptz', nullable: false, isPrimaryKey: false, isForeignKey: false }
    ],
    categories: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
      { name: 'name', type: 'text', nullable: false, isPrimaryKey: false, isForeignKey: false },
      { name: 'parent_id', type: 'uuid', nullable: true, isPrimaryKey: false, isForeignKey: true, foreignTable: 'categories', foreignColumn: 'id' },
      { name: 'created_at', type: 'timestamptz', nullable: false, isPrimaryKey: false, isForeignKey: false }
    ]
  };
  
  return commonColumns[tableName] || [
    { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
    { name: 'created_at', type: 'timestamptz', nullable: false, isPrimaryKey: false, isForeignKey: false }
  ];
}

// Fallback для підрахунку рядків
async function getFallbackRowCount(tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) return 0;
    return count || 0;
  } catch (error) {
    return 0;
  }
}

// Детальна інформація про таблицю
async function getTableDetails(tableName: string): Promise<TableInfo> {
  const [columns, constraints, indexes, rowCount] = await Promise.all([
    getTableColumns(tableName),
    getTableConstraints(tableName),
    getTableIndexes(tableName),
    getTableRowCount(tableName)
  ]);

  return {
    name: tableName,
    columns,
    constraints,
    indexes,
    rowCount
  };
}

// Колонки таблиці
async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  try {
    // Використовуємо SQL запит через RPC функцію
    const { data, error } = await supabase.rpc('get_table_columns', { 
      table_name_param: tableName 
    });
    
    if (error) {
      // Fallback: прямий запит (може не спрацювати через RLS)
      console.warn(`Fallback для колонок таблиці ${tableName}`);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`Помилка отримання колонок для ${tableName}:`, error);
    return [];
  }
}

// Обмеження таблиці
async function getTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
  try {
    const { data, error } = await supabase.rpc('get_table_constraints', {
      table_name_param: tableName
    });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Помилка отримання обмежень для ${tableName}:`, error);
    return [];
  }
}

// Індекси таблиці
async function getTableIndexes(tableName: string): Promise<IndexInfo[]> {
  try {
    const { data, error } = await supabase.rpc('get_table_indexes', {
      table_name_param: tableName
    });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Помилка отримання індексів для ${tableName}:`, error);
    return [];
  }
}

// Кількість рядків у таблиці
async function getTableRowCount(tableName: string): Promise<number> {
  try {
    // Для безпеки використовуємо статистику замість COUNT(*)
    const { data, error } = await supabase.rpc('get_table_row_count', {
      table_name_param: tableName
    });
    
    if (error) return 0;
    return data || 0;
  } catch (error) {
    return 0;
  }
}

// Функції в БД
async function getAllFunctions(): Promise<FunctionInfo[]> {
  try {
    const { data, error } = await supabase.rpc('get_database_functions');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Помилка отримання функцій:', error);
    return [];
  }
}

// ENUM типи
async function getAllEnums(): Promise<EnumInfo[]> {
  try {
    const { data, error } = await supabase.rpc('get_database_enums');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Помилка отримання ENUM типів:', error);
    return [];
  }
}

// Генерація міграції на основі аналізу
export function generateMigrationFromAnalysis(
  currentSchema: DatabaseSchema,
  desiredChanges: string[]
): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const migrationName = `${timestamp}_auto_generated_migration.sql`;
  
  let migration = `-- Автоматично згенерована міграція
-- Дата: ${new Date().toLocaleString('uk-UA')}
-- Базується на аналізі ${currentSchema.tables.length} таблиць

`;

  // Додаємо зміни
  desiredChanges.forEach((change, index) => {
    migration += `-- Зміна ${index + 1}: ${change}\n`;
    migration += generateChangeSQL(change, currentSchema);
    migration += '\n\n';
  });

  return migration;
}

// Генерування SQL для конкретної зміни
function generateChangeSQL(change: string, schema: DatabaseSchema): string {
  // Тут можна додати логіку для різних типів змін
  if (change.includes('add index')) {
    return generateIndexSQL(change, schema);
  } else if (change.includes('add column')) {
    return generateColumnSQL(change, schema);
  } else {
    return `-- TODO: Реалізувати ${change}`;
  }
}

function generateIndexSQL(change: string, schema: DatabaseSchema): string {
  // Приклад генерації індексу
  return `CREATE INDEX IF NOT EXISTS idx_auto_generated 
ON some_table (some_column);`;
}

function generateColumnSQL(change: string, schema: DatabaseSchema): string {
  // Приклад генерації колонки
  return `ALTER TABLE some_table 
ADD COLUMN new_column TEXT;`;
}

// Порівняння двох схем для виявлення змін
export function compareSchemas(
  oldSchema: DatabaseSchema,
  newSchema: DatabaseSchema
): string[] {
  const changes: string[] = [];
  
  // Нові таблиці
  const newTables = newSchema.tables.filter(
    newTable => !oldSchema.tables.find(oldTable => oldTable.name === newTable.name)
  );
  
  newTables.forEach(table => {
    changes.push(`Додана нова таблиця: ${table.name}`);
  });
  
  // Видалені таблиці
  const deletedTables = oldSchema.tables.filter(
    oldTable => !newSchema.tables.find(newTable => newTable.name === oldTable.name)
  );
  
  deletedTables.forEach(table => {
    changes.push(`Видалена таблиця: ${table.name}`);
  });
  
  // Зміни в існуючих таблицях
  newSchema.tables.forEach(newTable => {
    const oldTable = oldSchema.tables.find(t => t.name === newTable.name);
    if (oldTable) {
      const tableChanges = compareTableStructure(oldTable, newTable);
      changes.push(...tableChanges);
    }
  });
  
  return changes;
}

function compareTableStructure(oldTable: TableInfo, newTable: TableInfo): string[] {
  const changes: string[] = [];
  
  // Нові колонки
  const newColumns = newTable.columns.filter(
    newCol => !oldTable.columns.find(oldCol => oldCol.name === newCol.name)
  );
  
  newColumns.forEach(col => {
    changes.push(`Додана колонка ${col.name} в таблицю ${newTable.name}`);
  });
  
  return changes;
}