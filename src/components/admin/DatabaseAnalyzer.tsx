import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Search, 
  FileText, 
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Table,
  Key,
  BarChart3,
  Settings,
  Hash
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { analyzeDatabaseSchema, DatabaseSchema, TableInfo } from '@/lib/databaseAnalyzer';

interface DatabaseAnalyzerProps {
  onMigrationGenerated?: (migration: string) => void;
}

export function DatabaseAnalyzer({ onMigrationGenerated }: DatabaseAnalyzerProps) {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);

  // Автоматичний аналіз при завантаженні
  useEffect(() => {
    performAnalysis();
  }, []);

  const performAnalysis = async () => {
    setAnalyzing(true);
    setProgress(0);
    
    try {
      // Симуляція прогресу
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await analyzeDatabaseSchema();
      
      clearInterval(progressInterval);
      setProgress(100);
      setSchema(result);
      
      toast({
        title: 'Аналіз завершено!',
        description: `Проаналізовано ${result.tables.length} таблиць`,
      });
    } catch (error: any) {
      toast({
        title: 'Помилка аналізу',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const generateOptimizationMigration = () => {
    if (!schema) return;

    const migrationSql = generatePerformanceMigration(schema);
    onMigrationGenerated?.(migrationSql);
    
    toast({
      title: 'Міграція згенерована!',
      description: 'Міграцію оптимізації додано до SQL файлів',
    });
  };

  const generatePerformanceMigration = (schema: DatabaseSchema): string => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    let migration = `-- Автоматично згенерована міграція оптимізації
-- Дата: ${new Date().toLocaleString('uk-UA')}
-- Базується на аналізі ${schema.tables.length} таблиць

`;

    // Додаємо індекси для таблиць без них
    schema.tables.forEach(table => {
      if (table.indexes.length === 0 && table.columns.length > 1) {
        const primaryKey = table.columns.find(col => col.isPrimaryKey);
        if (primaryKey) {
          migration += `-- Додаємо індекс для таблиці ${table.name}\n`;
          migration += `CREATE INDEX IF NOT EXISTS idx_${table.name}_created_at \n`;
          migration += `ON ${table.name} (created_at DESC) \n`;
          migration += `WHERE created_at IS NOT NULL;\n\n`;
        }
      }
    });

    // Аналізуємо foreign keys
    schema.tables.forEach(table => {
      table.columns.forEach(col => {
        if (col.isForeignKey && col.foreignTable) {
          migration += `-- Оптимізація foreign key для ${table.name}.${col.name}\n`;
          migration += `CREATE INDEX IF NOT EXISTS idx_${table.name}_${col.name} \n`;
          migration += `ON ${table.name} (${col.name});\n\n`;
        }
      });
    });

    migration += `-- Оновлення статистики\n`;
    schema.tables.forEach(table => {
      migration += `ANALYZE ${table.name};\n`;
    });

    migration += `\nSELECT 'Міграція оптимізації завершена!' as result;`;

    return migration;
  };

  if (analyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Аналіз Бази Даних
          </CardTitle>
          <CardDescription>
            Автоматичний аналіз структури БД...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progress} className="h-3" />
            <div className="text-sm text-muted-foreground text-center">
              Аналізую структуру БД: {progress}%
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок та керування */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Автоматичний Аналіз БД
          </CardTitle>
          <CardDescription>
            Автоматичний перегляд та аналіз структури бази даних
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={performAnalysis}
              disabled={analyzing}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Повторити аналіз
            </Button>
            
            {schema && (
              <Button 
                onClick={generateOptimizationMigration}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <FileText className="h-4 w-4 mr-2" />
                Згенерувати оптимізацію
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Результати аналізу */}
      {schema && (
        <>
          {/* Загальна статистика */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Результати Аналізу
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Table className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{schema.tables.length}</div>
                  <div className="text-sm text-muted-foreground">Таблиць</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{schema.functions.length}</div>
                  <div className="text-sm text-muted-foreground">Функцій</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Hash className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{schema.enums.length}</div>
                  <div className="text-sm text-muted-foreground">ENUM типів</div>
                </div>
                
                <div className="text-center p-4 bg-muted rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <div className="text-2xl font-bold">
                    {schema.tables.filter(t => t.constraints.some(c => c.type === 'PRIMARY KEY')).length}
                  </div>
                  <div className="text-sm text-muted-foreground">З первинними ключами</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Список таблиць */}
          <Card>
            <CardHeader>
              <CardTitle>Таблиці БД</CardTitle>
              <CardDescription>
                Детальна інформація про структуру таблиць
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schema.tables.map((table) => (
                  <Card key={table.name} className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          <span className="font-medium">{table.name}</span>
                          <Badge variant="outline">
                            {table.columns.length} колонок
                          </Badge>
                          {table.rowCount !== undefined && (
                            <Badge variant="secondary">
                              {table.rowCount} рядків
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {table.constraints.map((constraint) => (
                            <Badge 
                              key={constraint.name} 
                              variant={constraint.type === 'PRIMARY KEY' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              <Key className="h-3 w-3 mr-1" />
                              {constraint.type}
                            </Badge>
                          ))}
                          
                          {table.indexes.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <BarChart3 className="h-3 w-3 mr-1" />
                              {table.indexes.length} індексів
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTable(table)}
                      >
                        Деталі
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Функції та ENUM типи */}
          {(schema.functions.length > 0 || schema.enums.length > 0) && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Функції */}
              {schema.functions.length > 0 && (
                <Card>
                  <CardHeader>
                                      <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Функції БД
                  </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {schema.functions.map((func) => (
                        <div key={func.name} className="p-3 bg-muted rounded">
                          <div className="font-medium">{func.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {func.language} • {func.returnType}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* ENUM типи */}
              {schema.enums.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      ENUM Типи
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {schema.enums.map((enumType) => (
                        <div key={enumType.name} className="p-3 bg-muted rounded">
                          <div className="font-medium">{enumType.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {enumType.values.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Рекомендації */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Рекомендації
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generateRecommendations(schema).map((recommendation, index) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Генерація рекомендацій на основі аналізу
function generateRecommendations(schema: DatabaseSchema): string[] {
  const recommendations: string[] = [];
  
  // Перевірка таблиць без індексів
  const tablesWithoutIndexes = schema.tables.filter(t => t.indexes.length === 0);
  if (tablesWithoutIndexes.length > 0) {
    recommendations.push(
      `${tablesWithoutIndexes.length} таблиць не мають індексів. Рекомендується додати індекси для покращення продуктивності.`
    );
  }
  
  // Перевірка foreign keys без індексів
  const unindexedForeignKeys = schema.tables.reduce((acc, table) => {
    const fkColumns = table.columns.filter(col => col.isForeignKey);
    return acc + fkColumns.length;
  }, 0);
  
  if (unindexedForeignKeys > 0) {
    recommendations.push(
      `Знайдено ${unindexedForeignKeys} foreign key колонок. Рекомендується додати індекси для них.`
    );
  }
  
  // Перевірка великих таблиць
  const largeTables = schema.tables.filter(t => (t.rowCount || 0) > 1000);
  if (largeTables.length > 0) {
    recommendations.push(
      `${largeTables.length} таблиць містять більше 1000 рядків. Розгляньте партиціювання або архівацію старих даних.`
    );
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Структура БД виглядає оптимально! 🎉');
  }
  
  return recommendations;
}