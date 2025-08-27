import { useState, useRef } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { SQLFileManager } from '@/components/admin/SQLFileManager';
import { DatabaseAnalyzer } from '@/components/admin/DatabaseAnalyzer';
import { FullDatabaseManager } from '@/components/admin/FullDatabaseManager';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Download, 
  Play, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Database,
  Clock,
  FileCode,
  Table,
  Database as DatabaseIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SQLResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  executionTime?: number;
  rowsAffected?: number;
}

interface SQLFile {
  name: string;
  content: string;
  size: number;
  lastModified: Date;
}

interface TableInfo {
  name: string;
  rowCount: number;
  size: string;
}

export default function SQLManager() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<'sql-editor' | 'database-manager' | 'file-manager' | 'analyzer'>('database-manager');
  const [sqlQuery, setSqlQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<SQLResult[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<SQLFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SQLFile | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Завантаження списку таблиць
  const loadTables = async () => {
    try {
      // Отримуємо список таблиць через стандартний API
      const { data: tablesData, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');

      if (error) throw error;

      // Отримуємо інформацію про кожну таблицю
      const tablesInfo: TableInfo[] = [];
      
      for (const table of tablesData || []) {
        try {
          const { count } = await supabase
            .from(table.table_name)
            .select('*', { count: 'exact', head: true });

          tablesInfo.push({
            name: table.table_name,
            rowCount: count || 0,
            size: 'N/A' // Розмір таблиці не доступний через API
          });
        } catch (err) {
          // Якщо немає доступу до таблиці, пропускаємо
          continue;
        }
      }

      setTables(tablesInfo);
    } catch (error) {
      console.error('Error loading tables:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити список таблиць",
        variant: "destructive",
      });
    }
  };

  // Експорт таблиці
  const exportTable = async (tableName: string) => {
    if (!tableName) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Отримуємо дані таблиці
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) throw error;

      // Створюємо CSV
      const csvContent = convertToCSV(data || []);
      
      // Створюємо файл для завантаження
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setExportProgress(100);
      
      toast({
        title: "Експорт завершено",
        description: `Таблицю ${tableName} експортовано успішно`,
      });

    } catch (error: any) {
      toast({
        title: "Помилка експорту",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Конвертація даних в CSV
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Екрануємо коми та лапки
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  // Експорт структури таблиці (DDL)
  const exportTableStructure = async (tableName: string) => {
    try {
      // Отримуємо інформацію про колонки
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (columnsError) throw columnsError;

      // Створюємо DDL
      let ddl = `-- Структура таблиці ${tableName}\n`;
      ddl += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      
      const columnDefs = columns?.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      });

      ddl += columnDefs?.join(',\n') || '';
      ddl += '\n);\n\n';

      // Додаємо індекси
      const { data: indexes, error: indexesError } = await supabase
        .from('information_schema.statistics')
        .select('*')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);

      if (!indexesError && indexes) {
        ddl += '-- Індекси\n';
        for (const index of indexes) {
          if (index.index_name && !index.index_name.includes('_pkey')) {
            ddl += `CREATE INDEX ${index.index_name} ON ${tableName} (${index.column_name});\n`;
          }
        }
      }

      // Створюємо файл для завантаження
      const blob = new Blob([ddl], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tableName}_structure_${new Date().toISOString().split('T')[0]}.sql`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Структуру експортовано",
        description: `DDL таблиці ${tableName} експортовано успішно`,
      });

    } catch (error: any) {
      toast({
        title: "Помилка експорту структури",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Перевірка прав доступу
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Доступ заборонено</h2>
            <p className="text-muted-foreground">У вас немає прав для доступу до цієї сторінки.</p>
          </div>
        </div>
      </div>
    );
  }

  // Виконання SQL запиту (якщо функція exec_sql існує)
  const executeSQL = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Помилка",
        description: "Введіть SQL запит",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      // Спробуємо використати функцію exec_sql, якщо вона існує
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: sqlQuery
      });

      if (error) {
        // Якщо функція не існує, показуємо помилку
        const result: SQLResult = {
          success: false,
          message: "Функція exec_sql не знайдена. Створіть її в Supabase Dashboard.",
          error: error.message,
          executionTime: Date.now() - startTime
        };
        
        setResults(prev => [result, ...prev]);
        
        toast({
          title: "Помилка",
          description: "Функція exec_sql не створена. Використовуйте експорт таблиць.",
          variant: "destructive",
        });
      } else {
        const result: SQLResult = {
          success: true,
          message: "SQL виконано успішно",
          data,
          executionTime: Date.now() - startTime
        };
        
        setResults(prev => [result, ...prev]);
        
        toast({
          title: "SQL виконано",
          description: "Запит виконано успішно",
        });
      }

    } catch (error: any) {
      const result: SQLResult = {
        success: false,
        message: "Помилка виконання SQL",
        error: error.message,
        executionTime: Date.now() - startTime
      };
      
      setResults(prev => [result, ...prev]);
      
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Завантаження SQL файлу
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newFiles: SQLFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.type !== 'text/plain' && !file.name.endsWith('.sql')) {
        toast({
          title: "Помилка",
          description: `Файл ${file.name} не є SQL файлом`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const content = await file.text();
        const sqlFile: SQLFile = {
          name: file.name,
          content,
          size: file.size,
          lastModified: new Date(file.lastModified)
        };

        newFiles.push(sqlFile);
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        toast({
          title: "Помилка",
          description: `Не вдалося прочитати файл ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setUploadedFiles(prev => [...newFiles, ...prev]);
    setIsUploading(false);
    setUploadProgress(0);

    if (newFiles.length > 0) {
      toast({
        title: "Файли завантажено",
        description: `Завантажено ${newFiles.length} SQL файлів`,
      });
    }

    // Очищаємо input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Виконання SQL з файлу
  const executeFile = async (file: SQLFile) => {
    setSqlQuery(file.content);
    setSelectedFile(file);
    
    toast({
      title: "Файл завантажено",
      description: `SQL з файлу ${file.name} завантажено в редактор`,
    });
  };

  // Експорт результатів
  const exportResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      results: results,
      totalQueries: results.length,
      successfulQueries: results.filter(r => r.success).length,
      failedQueries: results.filter(r => !r.success).length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sql-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Очищення результатів
  const clearResults = () => {
    setResults([]);
    toast({
      title: "Результати очищено",
      description: "Історію виконання SQL запитів очищено",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SQL Менеджер</h1>
          <p className="text-muted-foreground">
            Повноцінне управління базою даних
          </p>
        </div>

        {/* Система вкладок */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('database-manager')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'database-manager'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Table className="h-4 w-4" />
                <span>Управління БД</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sql-editor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sql-editor'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileCode className="h-4 w-4" />
                <span>SQL Редактор</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('file-manager')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'file-manager'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Файл Менеджер</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analyzer'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DatabaseIcon className="h-4 w-4" />
                <span>Аналізатор БД</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'database-manager' && (
          <FullDatabaseManager />
        )}

        {activeTab === 'sql-editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ліва колонка - SQL редактор та файли */}
          <div className="space-y-6">
            {/* SQL редактор */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  SQL Редактор
                </CardTitle>
                <CardDescription>
                  Введіть SQL запит для виконання (потребує функцію exec_sql)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Введіть SQL запит..."
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={executeSQL} 
                    disabled={isExecuting || !sqlQuery.trim()}
                    className="flex-1"
                  >
                    {isExecuting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Виконується...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Виконати SQL
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSqlQuery('')}
                    disabled={!sqlQuery.trim()}
                  >
                    Очистити
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Завантаження файлів */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Завантаження SQL файлів
                </CardTitle>
                <CardDescription>
                  Завантажте .sql файли для імпорту
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".sql,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Завантаження...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Вибрати SQL файли
                      </>
                    )}
                  </Button>
                  {isUploading && (
                    <div className="mt-4">
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Прогрес завантаження: {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Завантажені файли */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Завантажені файли:</h4>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB • 
                              {file.lastModified.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => executeFile(file)}
                        >
                          Завантажити
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Середня колонка - Експорт таблиць */}
          <div className="space-y-6">
            {/* Експорт таблиць */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  Експорт таблиць
                </CardTitle>
                <CardDescription>
                  Експорт даних та структури таблиць
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={loadTables}
                    className="flex-1"
                  >
                    <DatabaseIcon className="w-4 h-4 mr-2" />
                    Завантажити таблиці
                  </Button>
                </div>

                {tables.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Доступні таблиці:</h4>
                    {tables.map((table) => (
                      <div
                        key={table.name}
                        className="p-3 bg-muted rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{table.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {table.rowCount} рядків
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportTable(table.name)}
                            disabled={isExporting}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Експорт CSV
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportTableStructure(table.name)}
                            className="flex-1"
                          >
                            <FileCode className="w-4 h-4 mr-2" />
                            Структура
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExporting && (
                  <div className="mt-4">
                    <Progress value={exportProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Прогрес експорту: {Math.round(exportProgress)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Права колонка - результати та управління */}
          <div className="space-y-6">
            {/* Управління результатами */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Управління результатами
                </CardTitle>
                <CardDescription>
                  Експорт та очищення результатів виконання
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={exportResults}
                    disabled={results.length === 0}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Експорт результатів
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearResults}
                    disabled={results.length === 0}
                  >
                    Очистити
                  </Button>
                </div>
                
                {results.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Всього запитів: {results.length} • 
                    Успішно: {results.filter(r => r.success).length} • 
                    Помилок: {results.filter(r => !r.success).length}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Результати виконання */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Результати виконання
                </CardTitle>
                <CardDescription>
                  Історія виконання SQL запитів
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Результати виконання SQL запитів з'являться тут</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.success 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {result.success ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <Badge variant={result.success ? "default" : "destructive"}>
                                {result.success ? "Успішно" : "Помилка"}
                              </Badge>
                              {result.executionTime && (
                                <Badge variant="outline">
                                  {result.executionTime}ms
                                </Badge>
                              )}
                              {result.rowsAffected !== undefined && (
                                <Badge variant="outline">
                                  {result.rowsAffected} рядків
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium mb-1">
                              {result.message}
                            </p>
                            {result.error && (
                              <p className="text-sm text-red-600 bg-red-100 p-2 rounded">
                                {result.error}
                              </p>
                            )}
                            {result.data && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm text-muted-foreground">
                                  Показати дані
                                </summary>
                                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                                  {JSON.stringify(result.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
          </div>
        )}

        {activeTab === 'file-manager' && (
          <SQLFileManager 
            onFileExecute={(fileName, result) => {
              // Добавляем результат выполнения в историю
              const newResult: SQLResult = {
                success: result.rowsAffected !== undefined,
                message: result.message,
                data: result,
                executionTime: result.executionTime,
                rowsAffected: result.rowsAffected
              };
              
              setResults(prev => [
                {
                  ...newResult,
                  query: `-- Executed from file: ${fileName}`,
                  timestamp: new Date()
                },
                ...prev
              ]);
            }}
          />
        )}

        {activeTab === 'analyzer' && (
          <DatabaseAnalyzer
            onMigrationGenerated={(migration) => {
              // Додаємо згенеровану міграцію до SQL запитів
              setSqlQuery(migration);
              setActiveTab('sql-editor'); // Переключаємося на SQL редактор
              toast({
                title: 'Міграція згенерована',
                description: 'Міграцію додано до поля SQL запиту. Перевірте та виконайте її.',
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
