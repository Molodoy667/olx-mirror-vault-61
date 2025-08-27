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
        title: 'Ошибка',
        description: 'Не удалось загрузить список SQL файлов',
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
        title: 'Успех!',
        description: `SQL файл "${fileName}" выполнен успешно`,
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
        title: 'Ошибка выполнения',
        description: `Ошибка в файле "${fileName}": ${error.message}`,
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
        title: 'Файл удален',
        description: `SQL файл "${fileName}" удален успешно`,
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка удаления',
        description: `Не удалось удалить файл: ${error.message}`,
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
        return <Badge variant="secondary">Выполняется...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Успешно</Badge>;
      case 'error':
        return <Badge variant="destructive">Ошибка</Badge>;
      default:
        return <Badge variant="outline">Готов</Badge>;
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
          <CardTitle>SQL Файлы</CardTitle>
          <CardDescription>Загрузка...</CardDescription>
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
          SQL Файлы
        </CardTitle>
        <CardDescription>
          Управление и выполнение SQL файлов из папки /sql
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Кнопки действий */}
          <div className="flex gap-2">
            <Button 
              onClick={loadFiles}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Обновить список
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                // В реальности здесь бы был file input для загрузки
                toast({
                  title: 'Загрузка файлов',
                  description: 'Поместите .sql файлы в папку /sql для их отображения здесь',
                });
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Загрузить файл
            </Button>
          </div>

          {/* Список файлов */}
          {files.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                SQL файлы не найдены. Поместите .sql файлы в папку /sql
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <Card key={file.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                          <div className="text-sm text-green-600">
                            Выполнено за {file.executionTime}мс
                          </div>
                        )}
                        {file.error && (
                          <div className="text-sm text-red-600">
                            Ошибка: {file.error}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Просмотр содержимого */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(file)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{file.name}</DialogTitle>
                            <DialogDescription>
                              Содержимое SQL файла
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] w-full">
                            <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                              <code>{file.content}</code>
                            </pre>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      {/* Выполнить */}
                      <Button
                        onClick={() => executeFile(file)}
                        disabled={file.status === 'running'}
                        size="sm"
                        variant="default"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Выполнить
                      </Button>

                      {/* Удалить */}
                      <Button
                        onClick={() => deleteFile(file.name)}
                        disabled={file.status === 'running'}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Прогресс выполнения */}
                  {file.status === 'running' && executionProgress[file.name] !== undefined && (
                    <div className="mt-3">
                      <Progress value={executionProgress[file.name]} className="h-2" />
                      <div className="text-sm text-muted-foreground mt-1">
                        Выполнение: {executionProgress[file.name]}%
                      </div>
                    </div>
                  )}

                  {/* Результат выполнения */}
                  {file.result && file.status === 'success' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-sm text-green-800">
                        <strong>Результат:</strong> {file.result.message}
                      </div>
                      {file.result.rowsAffected !== undefined && (
                        <div className="text-sm text-green-700">
                          Затронуто строк: {file.result.rowsAffected}
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