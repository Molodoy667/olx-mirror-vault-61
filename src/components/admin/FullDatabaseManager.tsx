import React, { useState, useEffect } from 'react';
import { Database, Table, Code, Search, Plus, Edit, Trash2, Eye, RefreshCw, Settings, BarChart3 } from 'lucide-react';
import { databaseManager, type TableInfo, type FunctionInfo } from '../../lib/databaseManager';
import { TableViewer } from './TableViewer';
import { FunctionViewer } from './FunctionViewer';

export function FullDatabaseManager() {
  const [activeTab, setActiveTab] = useState<'tables' | 'functions'>('tables');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Завантаження таблиць
  const loadTables = async () => {
    try {
      setLoading(true);
      const tablesData = await databaseManager.getAllTables();
      setTables(tablesData);
    } catch (error) {
      console.error('Помилка завантаження таблиць:', error);
    } finally {
      setLoading(false);
    }
  };

  // Завантаження функцій
  const loadFunctions = async () => {
    try {
      setLoading(true);
      const functionsData = await databaseManager.getAllFunctions();
      setFunctions(functionsData);
    } catch (error) {
      console.error('Помилка завантаження функцій:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tables') {
      loadTables();
    } else {
      loadFunctions();
    }
  }, [activeTab]);

  // Фільтрація таблиць та функцій
  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFunctions = functions.filter(func =>
    func.function_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Повноцінне Управління Базою Даних
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Перегляд, редагування та управління таблицями і функціями
            </p>
          </div>
        </div>
        <button
          onClick={() => activeTab === 'tables' ? loadTables() : loadFunctions()}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Оновити</span>
        </button>
      </div>

      {/* Вкладки */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('tables')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tables'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Table className="h-4 w-4" />
              <span>Таблиці ({tables.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('functions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'functions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Функції ({functions.length})</span>
            </div>
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Лівий сайдбар - список таблиць/функцій */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Пошук ${activeTab === 'tables' ? 'таблиць' : 'функцій'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {activeTab === 'tables' ? (
                <div className="p-2">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Завантаження...</span>
                    </div>
                  ) : filteredTables.length === 0 ? (
                    <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                      Таблиці не знайдені
                    </div>
                  ) : (
                    filteredTables.map((table) => (
                      <button
                        key={table.table_name}
                        onClick={() => setSelectedTable(table.table_name)}
                        className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                          selectedTable === table.table_name
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Table className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {table.table_name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {table.row_count.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{table.table_size}</span>
                          <span>{table.description !== 'Немає опису' ? '📝' : ''}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-2">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Завантаження...</span>
                    </div>
                  ) : filteredFunctions.length === 0 ? (
                    <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                      Функції не знайдені
                    </div>
                  ) : (
                    filteredFunctions.map((func) => (
                      <button
                        key={func.function_name}
                        onClick={() => setSelectedFunction(func.function_name)}
                        className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                          selectedFunction === func.function_name
                            ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Code className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {func.function_name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                            {func.function_type}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-mono">{func.language}</span>
                          {func.description !== 'Немає опису' && (
                            <span className="ml-2">📝</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Правий контент - деталі таблиці/функції */}
        <div className="col-span-12 lg:col-span-8">
          {activeTab === 'tables' ? (
            selectedTable ? (
              <TableViewer 
                tableName={selectedTable} 
                onClose={() => setSelectedTable(null)}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="text-center">
                  <Table className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Оберіть таблицю
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Виберіть таблицю зі списку ліворуч для перегляду та редагування даних
                  </p>
                </div>
              </div>
            )
          ) : (
            selectedFunction ? (
              <FunctionViewer 
                functionName={selectedFunction}
                functionData={functions.find(f => f.function_name === selectedFunction)!}
                onClose={() => setSelectedFunction(null)}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                <div className="text-center">
                  <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Оберіть функцію
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Виберіть функцію зі списку ліворуч для перегляду коду та деталей
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}