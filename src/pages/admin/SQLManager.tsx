import { useState, useRef } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  FileCode
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

export default function SQLManager() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [sqlQuery, setSqlQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<SQLResult[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<SQLFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SQLFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Виконання SQL запиту
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
      // Розбиваємо SQL на окремі запити
      const queries = sqlQuery
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      const newResults: SQLResult[] = [];

      for (const query of queries) {
        if (!query.trim()) continue;

        try {
          const { data, error, count } = await supabase.rpc('exec_sql', {
            sql_query: query
          });

          if (error) {
            newResults.push({
              success: false,
              message: `Помилка виконання: ${query.substring(0, 50)}...`,
              error: error.message,
              executionTime: Date.now() - startTime
            });
          } else {
            newResults.push({
              success: true,
              message: `Успішно виконано: ${query.substring(0, 50)}...`,
              data,
              rowsAffected: count || 0,
              executionTime: Date.now() - startTime
            });
          }
        } catch (err: any) {
          newResults.push({
            success: false,
            message: `Помилка виконання: ${query.substring(0, 50)}...`,
            error: err.message,
            executionTime: Date.now() - startTime
          });
        }
      }

      setResults(prev => [...newResults, ...prev]);
      
      toast({
        title: "SQL виконано",
        description: `Виконано ${newResults.filter(r => r.success).length} з ${newResults.length} запитів`,
      });

    } catch (error: any) {
      const result: SQLResult = {
        success: false,
        message: "Критична помилка виконання",
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
            Управління базою даних через SQL запити, імпорт та експорт файлів
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  Введіть SQL запит для виконання
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
      </div>
    </div>
  );
}