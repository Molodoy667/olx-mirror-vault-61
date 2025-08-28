import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Play, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  showSuccessToast, 
  showErrorToast,
  showInfoToast 
} from '@/lib/toast-helpers';
import { loadSQLFiles, executeSQLFile, deleteSQLFile } from '@/lib/sqlFiles';

interface SQLFile {
  name: string;
  content: string;
  size: number;
  lastModified: string;
  status?: 'idle' | 'running' | 'success' | 'error' | 'warning';
  result?: any;
  error?: string;
  executionTime?: number;
  startTime?: number;
  warnings?: string[];
  rowsAffected?: number;
  tablesCreated?: string[];
  functionsCreated?: string[];
  lastExecuted?: string;
}

interface SQLFileManagerProps {
  onFileExecute?: (fileName: string, result: any) => void;
}

export function SQLFileManager({ onFileExecute }: SQLFileManagerProps) {
  const [files, setFiles] = useState<SQLFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<SQLFile | null>(null);
  const [executionProgress, setExecutionProgress] = useState<{ [key: string]: number }>({});

  // Загрузка списка SQL файлов
  const loadFiles = async () => {
    setLoading(true);
    try {
      const loadedFiles = await loadSQLFiles();
      setFiles(loadedFiles);
    } catch (error) {
      console.error('Error loading SQL files:', error);
      showErrorToast('Помилка', 'Не вдалося завантажити список SQL файлів');
    } finally {
      setLoading(false);
    }
  };

  // Выполнение SQL файла
  const executeFile = async (file: SQLFile) => {
    const fileName = file.name;
    const startTime = Date.now();
    
    // Обновляем статус файла
    setFiles(prev => prev.map(f => 
      f.name === fileName 
        ? { 
            ...f, 
            status: 'running', 
            result: null, 
            error: undefined,
            warnings: [],
            startTime,
            executionTime: undefined,
            rowsAffected: undefined
          }
        : f
    ));

    // Симуляция прогресса
    setExecutionProgress(prev => ({ ...prev, [fileName]: 0 }));
    
    const progressInterval = setInterval(() => {
      setExecutionProgress(prev => {
        const current = prev[fileName] || 0;
        if (current >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return { ...prev, [fileName]: current + 10 };
      });
    }, 200);

    try {
      // Выполняем SQL файл через утилиту
      const result = await executeSQLFile(fileName, file.content);
      const executionTime = Date.now() - startTime;

      clearInterval(progressInterval);
      setExecutionProgress(prev => ({ ...prev, [fileName]: 100 }));

      // Анализируем результат для определения статуса
      const hasWarnings = result.warnings && result.warnings.length > 0;
      const finalStatus = result.success ? (hasWarnings ? 'warning' : 'success') : 'error';

      // Анализируем SQL для определения что было создано
      const sqlContent = file.content.toLowerCase();
      const tablesCreated = extractCreatedObjects(sqlContent, 'table');
      const functionsCreated = extractCreatedObjects(sqlContent, 'function');

      // Обновляем статус файла
      setFiles(prev => prev.map(f => 
        f.name === fileName 
          ? { 
              ...f, 
              status: finalStatus,
              result,
              executionTime,
              lastExecuted: new Date().toISOString(),
              warnings: result.warnings || [],
              rowsAffected: result.rowsAffected || 0,
              tablesCreated,
              functionsCreated,
              error: result.success ? undefined : (result.error || 'Невідома помилка')
            }
          : f
      ));

      // Показываем соответствующий toast
      if (result.success) {
        if (hasWarnings) {
          showErrorToast('⚠️ Виконано з попередженнями', `SQL файл "${fileName}" виконано з попередженнями. Час: ${executionTime}мс`);
        } else {
          showSuccessToast('✅ Успішно виконано!', `SQL файл "${fileName}" виконано успішно. Час: ${executionTime}мс`);
        }
      } else {
        throw new Error(result.error || 'Помилка виконання SQL');
      }

      onFileExecute?.(fileName, result);

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      clearInterval(progressInterval);
      setExecutionProgress(prev => ({ ...prev, [fileName]: 0 }));

      // Детальный анализ ошибки
      const errorDetails = analyzeError(error);

      // Обновляем статус файла с ошибкой
      setFiles(prev => prev.map(f => 
        f.name === fileName 
          ? { 
              ...f, 
              status: 'error',
              error: errorDetails.message,
              executionTime,
              lastExecuted: new Date().toISOString(),
              result: {
                success: false,
                error: errorDetails.message,
                details: errorDetails.details,
                suggestion: errorDetails.suggestion
              }
            }
          : f
      ));

      showErrorToast('❌ Помилка виконання', `Файл "${fileName}": ${errorDetails.shortMessage}`);
    }
  };

  // Функция для извлечения созданных объектов из SQL
  const extractCreatedObjects = (sql: string, type: 'table' | 'function'): string[] => {
    const objects: string[] = [];
    const regex = type === 'table' 
      ? /create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)/gi
      : /create\s+(?:or\s+replace\s+)?function\s+(\w+)/gi;
    
    let match;
    while ((match = regex.exec(sql)) !== null) {
      objects.push(match[1]);
    }
    return objects;
  };

  // Функция для анализа ошибок
  const analyzeError = (error: any) => {
    const message = error.message || error.toString();
    
    // Определяем тип ошибки и даем рекомендации
    if (message.includes('relation') && message.includes('does not exist')) {
      return {
        message: `Таблиця не існує: ${message}`,
        shortMessage: 'Таблиця не існує',
        details: 'Перевірте, чи правильно вказана назва таблиці та чи була вона створена',
        suggestion: 'Спочатку виконайте міграції для створення необхідних таблиць'
      };
    }
    
    if (message.includes('function') && message.includes('does not exist')) {
      return {
        message: `Функція не існує: ${message}`,
        shortMessage: 'Функція не існує',
        details: 'Перевірте назву функції та її параметри',
        suggestion: 'Переконайтеся, що функція була створена або імпортована'
      };
    }
    
    if (message.includes('syntax error')) {
      return {
        message: `Синтаксична помилка SQL: ${message}`,
        shortMessage: 'Синтаксична помилка',
        details: 'Перевірте правильність SQL синтаксису',
        suggestion: 'Використайте SQL валідатор або перевірте документацію PostgreSQL'
      };
    }
    
    if (message.includes('permission denied')) {
      return {
        message: `Недостатньо прав доступу: ${message}`,
        shortMessage: 'Недостатньо прав',
        details: 'У вас немає прав для виконання цієї операції',
        suggestion: 'Зверніться до адміністратора для надання необхідних прав'
      };
    }
    
    if (message.includes('already exists')) {
      return {
        message: `Об\'єкт вже існує: ${message}`,
        shortMessage: 'Об\'єкт існує',
        details: 'Спроба створити об\'єкт, який вже існує в базі даних',
        suggestion: 'Використайте CREATE IF NOT EXISTS або видаліть існуючий об\'єкт'
      };
    }
    
    // Общая ошибка
    return {
      message: message,
      shortMessage: 'Помилка виконання',
      details: 'Детальна інформація в повідомленні помилки',
      suggestion: 'Перевірте SQL код та з\'єднання з базою даних'
    };
  };

  // Удаление SQL файла
  const deleteFile = async (fileName: string) => {
    try {
      await deleteSQLFile(fileName);
      setFiles(prev => prev.filter(f => f.name !== fileName));
      
      showSuccessToast('Файл видалено', `SQL файл "${fileName}" видалено успішно`);
    } catch (error: any) {
      showErrorToast('Помилка видалення', `Не вдалося видалити файл: ${error.message}`);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (file: SQLFile) => {
    switch (file.status) {
      case 'running':
        return <Badge variant="secondary" className="animate-pulse">⏳ Виконується...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">✅ Успішно</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">⚠️ З попередженнями</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Помилка</Badge>;
      default:
        return <Badge variant="outline">📄 Готовий</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SQL Файли</CardTitle>
          <CardDescription>Завантаження...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Clock className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          SQL Файли
        </CardTitle>
        <CardDescription>
          Управління та виконання SQL файлів з папки /sql
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Кнопки дій */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={loadFiles}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Оновити список
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                // В реальності тут був би file input для завантаження
                showInfoToast('Завантаження файлів', 'Помістіть .sql файли в папку /sql для їх відображення тут');
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Завантажити файл
            </Button>
          </div>

          {/* Список файлів */}
          {files.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                SQL файли не знайдені. Помістіть .sql файли в папку /sql
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <Card key={file.name} className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getStatusIcon(file.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{file.name}</span>
                          {getStatusBadge(file)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                        </div>
                        {/* Дополнительная информация о файле */}
                        <div className="flex flex-col gap-1 mt-1">
                          {file.lastExecuted && (
                            <div className="text-xs text-muted-foreground">
                              Останнє виконання: {formatDate(file.lastExecuted)}
                            </div>
                          )}
                          {file.executionTime && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              ⏱️ Час виконання: {file.executionTime}мс
                            </div>
                          )}
                          {file.rowsAffected !== undefined && file.rowsAffected > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              📊 Рядків змінено: {file.rowsAffected}
                            </div>
                          )}
                          {file.tablesCreated && file.tablesCreated.length > 0 && (
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              📋 Створено таблиць: {file.tablesCreated.join(', ')}
                            </div>
                          )}
                          {file.functionsCreated && file.functionsCreated.length > 0 && (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400">
                              ⚙️ Створено функцій: {file.functionsCreated.join(', ')}
                            </div>
                          )}
                          {file.warnings && file.warnings.length > 0 && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400">
                              ⚠️ Попередження: {file.warnings.length} шт.
                            </div>
                          )}
                          {file.error && (
                            <div className="text-xs text-red-600 dark:text-red-400">
                              ❌ Помилка: {file.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Перегляд вмісту */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(file)}
                            className="flex-shrink-0"
                          >
                            <Eye className="h-4 w-4 lg:mr-1" />
                            <span className="hidden lg:inline">Переглянути</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] lg:max-w-4xl max-h-[90vh] lg:max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle className="text-base lg:text-lg break-all">{file.name}</DialogTitle>
                            <DialogDescription>
                              Вміст SQL файлу
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] lg:h-[60vh] w-full">
                            <pre className="text-xs lg:text-sm bg-muted dark:bg-muted p-4 rounded-md overflow-auto">
                              <code>{file.content}</code>
                            </pre>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      {/* Виконати */}
                      <Button
                        onClick={() => executeFile(file)}
                        disabled={file.status === 'running'}
                        size="sm"
                        variant="default"
                        className="flex-shrink-0"
                      >
                        <Play className="h-4 w-4 lg:mr-1" />
                        <span className="hidden lg:inline">Виконати</span>
                      </Button>

                      {/* Видалити */}
                      <Button
                        onClick={() => deleteFile(file.name)}
                        disabled={file.status === 'running'}
                        size="sm"
                        variant="destructive"
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Видалити</span>
                      </Button>
                    </div>
                  </div>

                  {/* Прогрес виконання */}
                  {file.status === 'running' && executionProgress[file.name] !== undefined && (
                    <div className="mt-3">
                      <Progress value={executionProgress[file.name]} className="h-2" />
                      <div className="text-sm text-muted-foreground mt-1">
                        Виконання: {executionProgress[file.name]}%
                      </div>
                    </div>
                  )}

                  {/* Детальний результат виконання */}
                  {file.result && (
                    <div className="mt-3">
                      {/* Успішний результат */}
                      {file.status === 'success' && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
                          <div className="text-sm text-green-800 dark:text-green-200">
                            <strong>✅ Успішно виконано!</strong>
                          </div>
                          {file.result.message && (
                            <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                              {file.result.message}
                            </div>
                          )}
                          <div className="text-xs text-green-600 dark:text-green-400 mt-2 flex flex-wrap gap-4">
                            {file.executionTime && (
                              <span>⏱️ {file.executionTime}мс</span>
                            )}
                            {file.rowsAffected !== undefined && (
                              <span>📊 {file.rowsAffected} рядків</span>
                            )}
                            {file.tablesCreated && file.tablesCreated.length > 0 && (
                              <span>📋 {file.tablesCreated.length} таблиць</span>
                            )}
                            {file.functionsCreated && file.functionsCreated.length > 0 && (
                              <span>⚙️ {file.functionsCreated.length} функцій</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Результат з попередженнями */}
                      {file.status === 'warning' && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
                          <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>⚠️ Виконано з попередженнями</strong>
                          </div>
                          {file.result.message && (
                            <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              {file.result.message}
                            </div>
                          )}
                          {file.warnings && file.warnings.length > 0 && (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                              <strong>Попередження:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {file.warnings.map((warning, index) => (
                                  <li key={index}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Результат з помилкою */}
                      {file.status === 'error' && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
                          <div className="text-sm text-red-800 dark:text-red-200">
                            <strong>❌ Помилка виконання</strong>
                          </div>
                          {file.result.details && (
                            <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                              {file.result.details}
                            </div>
                          )}
                          {file.error && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-2 font-mono bg-red-100 dark:bg-red-900/50 p-2 rounded">
                              {file.error}
                            </div>
                          )}
                          {file.result.suggestion && (
                            <div className="text-xs text-red-500 dark:text-red-400 mt-2">
                              <strong>💡 Рекомендація:</strong> {file.result.suggestion}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}