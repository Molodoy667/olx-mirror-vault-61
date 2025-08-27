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
import { toast } from '@/hooks/use-toast';
import { loadSQLFiles, executeSQLFile, deleteSQLFile } from '@/lib/sqlFiles';

interface SQLFile {
  name: string;
  content: string;
  size: number;
  lastModified: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  executionTime?: number;
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
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити список SQL файлів',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Выполнение SQL файла
  const executeFile = async (file: SQLFile) => {
    const fileName = file.name;
    
    // Обновляем статус файла
    setFiles(prev => prev.map(f => 
      f.name === fileName 
        ? { ...f, status: 'running', result: null, error: undefined }
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

      clearInterval(progressInterval);
      setExecutionProgress(prev => ({ ...prev, [fileName]: 100 }));

      // Обновляем статус файла
      setFiles(prev => prev.map(f => 
        f.name === fileName 
          ? { 
              ...f, 
              status: 'success', 
              result,
              executionTime: result.executionTime 
            }
          : f
      ));

      toast({
        title: 'Успіх!',
        description: `SQL файл "${fileName}" виконано успішно`,
      });

      onFileExecute?.(fileName, result);

    } catch (error: any) {
      clearInterval(progressInterval);
      setExecutionProgress(prev => ({ ...prev, [fileName]: 0 }));

      // Обновляем статус файла с ошибкой
      setFiles(prev => prev.map(f => 
        f.name === fileName 
          ? { 
              ...f, 
              status: 'error', 
              error: error.message || 'Неизвестная ошибка'
            }
          : f
      ));

      toast({
        title: 'Помилка виконання',
        description: `Помилка у файлі "${fileName}": ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  // Удаление SQL файла
  const deleteFile = async (fileName: string) => {
    try {
      await deleteSQLFile(fileName);
      setFiles(prev => prev.filter(f => f.name !== fileName));
      
      toast({
        title: 'Файл видалено',
        description: `SQL файл "${fileName}" видалено успішно`,
      });
    } catch (error: any) {
      toast({
        title: 'Помилка видалення',
        description: `Не вдалося видалити файл: ${error.message}`,
        variant: 'destructive'
      });
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
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (file: SQLFile) => {
    switch (file.status) {
      case 'running':
        return <Badge variant="secondary">Виконується...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Успішно</Badge>;
      case 'error':
        return <Badge variant="destructive">Помилка</Badge>;
      default:
        return <Badge variant="outline">Готовий</Badge>;
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
                toast({
                  title: 'Завантаження файлів',
                  description: 'Помістіть .sql файли в папку /sql для їх відображення тут',
                });
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
                        {file.executionTime && (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            Виконано за {file.executionTime}мс
                          </div>
                        )}
                        {file.error && (
                          <div className="text-sm text-red-600 dark:text-red-400">
                            Помилка: {file.error}
                          </div>
                        )}
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

                  {/* Результат виконання */}
                  {file.result && file.status === 'success' && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="text-sm text-green-800 dark:text-green-200">
                        <strong>Результат:</strong> {file.result.message}
                      </div>
                      {file.result.rowsAffected !== undefined && (
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Зачеплено рядків: {file.result.rowsAffected}
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