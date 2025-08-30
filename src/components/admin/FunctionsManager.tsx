import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileCode, 
  Play, 
  Trash2, 
  Eye, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccessToast, showErrorToast, showInfoToast } from '@/lib/toast-helpers';

interface DatabaseFunction {
  function_name: string;
  function_schema: string;
  function_definition: string;
  function_type: string;
  return_type: string;
  function_language: string;
  is_security_definer: boolean;
  function_owner: string;
  created_at?: string;
}

interface FunctionExecution {
  function_name: string;
  parameters: string;
  result?: any;
  error?: string;
  execution_time?: number;
  status: 'success' | 'error' | 'running';
}

export function FunctionsManager() {
  const [functions, setFunctions] = useState<DatabaseFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<FunctionExecution[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | null>(null);
  const [functionParams, setFunctionParams] = useState('');
  const [executing, setExecuting] = useState<string | null>(null);

  // Загрузка списка функций
  const loadFunctions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          SELECT 
            p.proname as function_name,
            n.nspname as function_schema,
            pg_get_functiondef(p.oid) as function_definition,
            CASE p.prokind 
              WHEN 'f' THEN 'function'
              WHEN 'p' THEN 'procedure'
              WHEN 'a' THEN 'aggregate'
              WHEN 'w' THEN 'window'
              ELSE 'unknown'
            END as function_type,
            pg_get_function_result(p.oid) as return_type,
            l.lanname as function_language,
            p.prosecdef as is_security_definer,
            r.rolname as function_owner
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          JOIN pg_language l ON p.prolang = l.oid
          JOIN pg_roles r ON p.proowner = r.oid
          WHERE n.nspname = 'public'
          AND p.prokind IN ('f', 'p')
          ORDER BY p.proname;
        `
      });

      if (error) throw error;

      const functionsData = Array.isArray(data) ? data : (data?.result || []);
      setFunctions(functionsData);
      
      showSuccessToast('Функції завантажено', `Знайдено ${functionsData.length} функцій`);
    } catch (error: any) {
      console.error('Error loading functions:', error);
      showErrorToast('Помилка', 'Не вдалося завантажити список функцій');
      setFunctions([]);
    } finally {
      setLoading(false);
    }
  };

  // Выполнение функции
  const executeFunction = async (func: DatabaseFunction, params: string = '') => {
    if (executing) return;
    
    setExecuting(func.function_name);
    const startTime = Date.now();
    
    try {
      // Формируем SQL запрос для вызова функции
      const paramsList = params.trim() ? params : '';
      const query = `SELECT ${func.function_name}(${paramsList});`;
      
      const { data, error } = await supabase.rpc('exec_sql', { query });
      
      const executionTime = Date.now() - startTime;
      
      const execution: FunctionExecution = {
        function_name: func.function_name,
        parameters: paramsList,
        execution_time: executionTime,
        status: error ? 'error' : 'success',
        result: error ? undefined : data,
        error: error?.message
      };
      
      setExecutions(prev => [execution, ...prev]);
      
      if (error) {
        showErrorToast('Помилка виконання', `Функція ${func.function_name}: ${error.message}`);
      } else {
        showSuccessToast('Функція виконана', `${func.function_name} виконана за ${executionTime}мс`);
      }
      
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      setExecutions(prev => [{
        function_name: func.function_name,
        parameters: params,
        execution_time: executionTime,
        status: 'error',
        error: error.message
      }, ...prev]);
      
      showErrorToast('Помилка', `Не вдалося виконати функцію: ${error.message}`);
    } finally {
      setExecuting(null);
    }
  };

  // Удаление функции
  const dropFunction = async (func: DatabaseFunction) => {
    if (!confirm(`Ви впевнені що хочете видалити функцію ${func.function_name}?`)) {
      return;
    }
    
    try {
      const query = `DROP FUNCTION IF EXISTS ${func.function_schema}.${func.function_name} CASCADE;`;
      const { error } = await supabase.rpc('exec_sql', { query });
      
      if (error) throw error;
      
      setFunctions(prev => prev.filter(f => f.function_name !== func.function_name));
      showSuccessToast('Функцію видалено', `${func.function_name} успішно видалено`);
      
    } catch (error: any) {
      showErrorToast('Помилка видалення', error.message);
    }
  };

  useEffect(() => {
    loadFunctions();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <FileCode className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Список функций */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Функції бази даних
            </CardTitle>
            <CardDescription>
              Управління PostgreSQL функціями та процедурами
            </CardDescription>
            <Button onClick={loadFunctions} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Оновити список
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Завантаження функцій...</p>
              </div>
            ) : functions.length === 0 ? (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Функції не знайдено. Можливо вам потрібно виконати SQL файли для створення функцій.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {functions.map((func) => (
                    <div
                      key={`${func.function_schema}.${func.function_name}`}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFunction?.function_name === func.function_name
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedFunction(func)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">{func.function_name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {func.function_language}
                          </Badge>
                          {func.is_security_definer && (
                            <Badge variant="secondary" className="text-xs">
                              DEFINER
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Повертає: {func.return_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Власник: {func.function_owner}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Детали функции и выполнение */}
      <div className="space-y-4">
        {selectedFunction ? (
          <>
            {/* Информация о функции */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  {selectedFunction.function_name}
                </CardTitle>
                <CardDescription>
                  {selectedFunction.function_type} • {selectedFunction.function_language}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Схема:</strong> {selectedFunction.function_schema}
                  </div>
                  <div>
                    <strong>Тип:</strong> {selectedFunction.function_type}
                  </div>
                  <div>
                    <strong>Мова:</strong> {selectedFunction.function_language}
                  </div>
                  <div>
                    <strong>Повертає:</strong> {selectedFunction.return_type}
                  </div>
                </div>

                {/* Выполнение функции */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Параметри (через кому):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={functionParams}
                      onChange={(e) => setFunctionParams(e.target.value)}
                      placeholder="'param1', 123, true"
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      disabled={executing === selectedFunction.function_name}
                    />
                    <Button
                      onClick={() => executeFunction(selectedFunction, functionParams)}
                      disabled={executing === selectedFunction.function_name}
                      size="sm"
                    >
                      {executing === selectedFunction.function_name ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Кнопки управления */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedFunction.function_definition);
                      showInfoToast('Скопійовано', 'Код функції скопійовано в буфер обміну');
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Код
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => dropFunction(selectedFunction)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Видалити
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* История выполнений */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Історія виконань</CardTitle>
              </CardHeader>
              <CardContent>
                {executions.filter(e => e.function_name === selectedFunction.function_name).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Функція ще не виконувалася
                  </p>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {executions
                        .filter(e => e.function_name === selectedFunction.function_name)
                        .map((execution, index) => (
                          <div key={index} className="p-2 border rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(execution.status)}
                                <span className="font-medium">{execution.function_name}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {execution.execution_time}мс
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              Параметри: {execution.parameters || 'без параметрів'}
                            </div>
                            {execution.error && (
                              <div className="text-red-600 mt-1">
                                Помилка: {execution.error}
                              </div>
                            )}
                            {execution.result && (
                              <div className="text-green-600 mt-1">
                                Результат: {JSON.stringify(execution.result).substring(0, 100)}...
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Оберіть функцію зі списку для перегляду деталей</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}