import React, { useState } from 'react';
import { Code, ChevronLeft, Copy, Eye, EyeOff, Settings, FileText, Database } from 'lucide-react';
import { type FunctionInfo } from '../../lib/databaseManager';

interface FunctionViewerProps {
  functionName: string;
  functionData: FunctionInfo;
  onClose: () => void;
}

export function FunctionViewer({ functionName, functionData, onClose }: FunctionViewerProps) {
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Копіювання в буфер обміну
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Помилка копіювання:', error);
    }
  };

  // Форматування аргументів
  const formatArguments = (args: string): string => {
    if (!args || args.trim() === '') return 'Немає аргументів';
    return args;
  };

  // Отримання кольору для типу функції
  const getFunctionTypeColor = (type: string): string => {
    switch (type) {
      case 'function':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'procedure':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'aggregate':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'window':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Форматування SQL коду
  const formatSQLCode = (code: string): string => {
    if (!code || code === 'Код недоступний') return code;
    
    // Базове форматування SQL
    return code
      .replace(/\bSELECT\b/gi, 'SELECT')
      .replace(/\bFROM\b/gi, 'FROM')
      .replace(/\bWHERE\b/gi, 'WHERE')
      .replace(/\bINNER JOIN\b/gi, 'INNER JOIN')
      .replace(/\bLEFT JOIN\b/gi, 'LEFT JOIN')
      .replace(/\bRIGHT JOIN\b/gi, 'RIGHT JOIN')
      .replace(/\bFULL JOIN\b/gi, 'FULL JOIN')
      .replace(/\bORDER BY\b/gi, 'ORDER BY')
      .replace(/\bGROUP BY\b/gi, 'GROUP BY')
      .replace(/\bHAVING\b/gi, 'HAVING')
      .replace(/\bINSERT INTO\b/gi, 'INSERT INTO')
      .replace(/\bUPDATE\b/gi, 'UPDATE')
      .replace(/\bDELETE FROM\b/gi, 'DELETE FROM')
      .replace(/\bCREATE\b/gi, 'CREATE')
      .replace(/\bALTER\b/gi, 'ALTER')
      .replace(/\bDROP\b/gi, 'DROP')
      .replace(/\bBEGIN\b/gi, 'BEGIN')
      .replace(/\bEND\b/gi, 'END')
      .replace(/\bRETURN\b/gi, 'RETURN')
      .replace(/\bIF\b/gi, 'IF')
      .replace(/\bELSE\b/gi, 'ELSE')
      .replace(/\bELSIF\b/gi, 'ELSIF')
      .replace(/\bTHEN\b/gi, 'THEN');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <Code className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {functionName}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFunctionTypeColor(functionData.function_type)}`}>
                  {functionData.function_type}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {functionData.language}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowSourceCode(!showSourceCode)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {showSourceCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showSourceCode ? 'Приховати код' : 'Показати код'}</span>
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="p-6 space-y-6">
        {/* Основна інформація */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Аргументи */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Аргументи</h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {formatArguments(functionData.arguments)}
              </code>
            </div>
          </div>

          {/* Тип повернення */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Тип повернення</h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <code className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                {functionData.return_type}
              </code>
            </div>
          </div>
        </div>

        {/* Опис */}
        {functionData.description && functionData.description !== 'Немає опису' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Опис</h3>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
              <p className="text-gray-700 dark:text-gray-300">
                {functionData.description}
              </p>
            </div>
          </div>
        )}

        {/* Деталі функції */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Деталі</h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Назва функції</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{functionData.function_name}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Тип</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFunctionTypeColor(functionData.function_type)}`}>
                      {functionData.function_type}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Мова</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {functionData.language}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Схема</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">public</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Вихідний код */}
        {showSourceCode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Вихідний код</h3>
              </div>
              <button
                onClick={() => copyToClipboard(functionData.source_code)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Copy className="h-4 w-4" />
                <span>{copied ? 'Скопійовано!' : 'Копіювати'}</span>
              </button>
            </div>
            
            {functionData.source_code && functionData.source_code !== 'Код недоступний' ? (
              <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100 dark:text-gray-200 font-mono whitespace-pre-wrap">
                  <code>{formatSQLCode(functionData.source_code)}</code>
                </pre>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <EyeOff className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-700 dark:text-red-300">
                    Вихідний код цієї функції недоступний для перегляду
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Приклад використання */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Приклад використання</h3>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <code className="text-sm text-blue-700 dark:text-blue-300 font-mono">
              SELECT * FROM {functionName}({formatArguments(functionData.arguments) === 'Немає аргументів' ? '' : 'параметри'});
            </code>
          </div>
        </div>

        {/* Додаткова інформація */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Увага</h4>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Будьте обережні при виконанні функцій, особливо тих, що змінюють дані в базі. 
                Завжди перевіряйте параметри перед виконанням.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}