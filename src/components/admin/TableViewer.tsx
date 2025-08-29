import React, { useState, useEffect } from 'react';
import { 
  Table, Edit, Trash2, Plus, Search, Eye, Settings, BarChart3, 
  ChevronLeft, ChevronRight, Save, X, Key, Link, RefreshCw, Download 
} from 'lucide-react';
import { databaseManager, type ColumnInfo, type TableData, type IndexInfo } from '../../lib/databaseManager';

interface TableViewerProps {
  tableName: string;
  onClose: () => void;
}

export function TableViewer({ tableName, onClose }: TableViewerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'data' | 'structure' | 'indexes'>('data');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [tableData, setTableData] = useState<TableData>({ data: [], total_count: 0, page_count: 0 });
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState<Record<string, any>>({});

  // Завантаження структури таблиці
  const loadTableStructure = async () => {
    try {
      const structure = await databaseManager.getTableStructure(tableName);
      setColumns(structure);
      
      // Ініціалізація нового запису з дефолтними значеннями
      const defaultRecord: Record<string, any> = {};
      structure.forEach(col => {
        if (col.column_default) {
          defaultRecord[col.column_name] = '';
        } else if (col.data_type.includes('int') || col.data_type.includes('numeric')) {
          defaultRecord[col.column_name] = '';
        } else if (col.data_type.includes('bool')) {
          defaultRecord[col.column_name] = false;
        } else {
          defaultRecord[col.column_name] = '';
        }
      });
      setNewRecord(defaultRecord);
    } catch (error) {
      console.error('Помилка завантаження структури:', error);
    }
  };

  // Завантаження даних таблиці
  const loadTableData = async () => {
    try {
      setLoading(true);
      const data = await databaseManager.getTableData(
        tableName, 
        currentPage, 
        pageSize, 
        searchQuery, 
        sortColumn, 
        sortDirection
      );
      setTableData(data);
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    } finally {
      setLoading(false);
    }
  };

  // Завантаження індексів
  const loadTableIndexes = async () => {
    try {
      const indexData = await databaseManager.getTableIndexes(tableName);
      setIndexes(indexData);
    } catch (error) {
      console.error('Помилка завантаження індексів:', error);
    }
  };

  useEffect(() => {
    loadTableStructure();
    if (activeSubTab === 'data') {
      loadTableData();
    } else if (activeSubTab === 'indexes') {
      loadTableIndexes();
    }
  }, [tableName, activeSubTab, currentPage, pageSize, searchQuery, sortColumn, sortDirection, loadTableData, loadTableIndexes, loadTableStructure]);

  // Отримання primary key
  const getPrimaryKey = (): string => {
    const pkColumn = columns.find(col => col.is_primary_key);
    return pkColumn?.column_name || 'id';
  };

  // Обробка сортування
  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortColumn(columnName);
      setSortDirection('ASC');
    }
    setCurrentPage(1);
  };

  // Додавання нового запису
  const handleAddRecord = async () => {
    try {
      setLoading(true);
      await databaseManager.insertRecord(tableName, newRecord);
      setShowAddForm(false);
      setNewRecord({});
      loadTableData();
    } catch (error) {
      console.error('Помилка додавання запису:', error);
      alert(`Помилка додавання запису: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Оновлення запису
  const handleUpdateRecord = async () => {
    try {
      setLoading(true);
      const primaryKey = getPrimaryKey();
      const recordId = editingRecord[primaryKey];
      await databaseManager.updateRecord(tableName, recordId, editingRecord);
      setEditingRecord(null);
      loadTableData();
    } catch (error) {
      console.error('Помилка оновлення запису:', error);
      alert(`Помилка оновлення запису: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Видалення запису
  const handleDeleteRecord = async (record: any) => {
    const primaryKey = getPrimaryKey();
    const recordId = record[primaryKey];
    
    if (!confirm(`Ви впевнені, що хочете видалити запис з ID: ${recordId}?`)) {
      return;
    }

    try {
      setLoading(true);
      const success = await databaseManager.deleteRecord(tableName, recordId);
      if (success) {
        loadTableData();
      } else {
        alert('Не вдалося видалити запис');
      }
    } catch (error) {
      console.error('Помилка видалення запису:', error);
      alert(`Помилка видалення запису: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Форматування значень для відображення
  const formatValue = (value: any, dataType: string): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    if (dataType.includes('timestamp') || dataType.includes('date')) {
      return new Date(value).toLocaleString('uk-UA');
    }
    return String(value);
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
            <Table className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tableName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Всього записів: {tableData.total_count.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {activeSubTab === 'data' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                <span>Додати</span>
              </button>
            )}
            <button
              onClick={() => activeSubTab === 'data' ? loadTableData() : activeSubTab === 'indexes' ? loadTableIndexes() : loadTableStructure()}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Оновити</span>
            </button>
          </div>
        </div>

        {/* Підвкладки */}
        <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveSubTab('data')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'data'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Дані</span>
              </div>
            </button>
            <button
              onClick={() => setActiveSubTab('structure')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'structure'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Структура</span>
              </div>
            </button>
            <button
              onClick={() => setActiveSubTab('indexes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSubTab === 'indexes'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Індекси</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Контент */}
      <div className="p-4">
        {activeSubTab === 'data' && (
          <div className="space-y-4">
            {/* Пошук та фільтри */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Пошук в таблиці..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-500 dark:text-gray-400">Записів на сторінці:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Таблиця даних */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.column_name}
                        onClick={() => handleSort(column.column_name)}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.column_name}</span>
                          {column.is_primary_key && <Key className="h-3 w-3 text-yellow-500" />}
                          {column.is_foreign_key && <Link className="h-3 w-3 text-blue-500" />}
                          {sortColumn === column.column_name && (
                            <span className="text-blue-500">
                              {sortDirection === 'ASC' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-4 py-8 text-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                        <p className="mt-2 text-gray-500">Завантаження...</p>
                      </td>
                    </tr>
                  ) : tableData.data.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Дані не знайдені
                      </td>
                    </tr>
                  ) : (
                    tableData.data.map((record, index) => {
                      const primaryKey = getPrimaryKey();
                      const isEditing = editingRecord && editingRecord[primaryKey] === record[primaryKey];
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          {columns.map((column) => (
                            <td key={column.column_name} className="px-4 py-3 whitespace-nowrap text-sm">
                              {isEditing ? (
                                <input
                                  type={column.data_type.includes('int') || column.data_type.includes('numeric') ? 'number' : 
                                        column.data_type.includes('bool') ? 'checkbox' : 'text'}
                                  value={editingRecord[column.column_name] || ''}
                                  checked={column.data_type.includes('bool') ? editingRecord[column.column_name] : undefined}
                                  onChange={(e) => setEditingRecord({
                                    ...editingRecord,
                                    [column.column_name]: column.data_type.includes('bool') ? e.target.checked : e.target.value
                                  })}
                                  className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              ) : (
                                <span className="text-gray-900 dark:text-white">
                                  {formatValue(record[column.column_name], column.data_type)}
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {isEditing ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleUpdateRecord}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingRecord(null)}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => setEditingRecord(record)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecord(record)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Пагінація */}
            {tableData.page_count > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Сторінка {currentPage} з {tableData.page_count}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(tableData.page_count, currentPage + 1))}
                    disabled={currentPage === tableData.page_count}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'structure' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Колонка</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nullable</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">За замовчуванням</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ключі</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {columns.map((column) => (
                  <tr key={column.column_name}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {column.column_name}
                        </span>
                        {column.is_primary_key && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <Key className="h-3 w-3 mr-1" />
                            PK
                          </span>
                        )}
                        {column.is_foreign_key && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <Link className="h-3 w-3 mr-1" />
                            FK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {column.data_type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        column.is_nullable === 'YES' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {column.is_nullable === 'YES' ? 'Так' : 'Ні'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {column.column_default || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {column.is_foreign_key && (
                        <span>
                          → {column.foreign_table}.{column.foreign_column}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'indexes' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Індекс</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Колонки</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Унікальний</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Розмір</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {indexes.map((index) => (
                  <tr key={index.index_name}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {index.index_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {index.column_names}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index.index_type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        index.is_unique 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {index.is_unique ? 'Так' : 'Ні'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {index.index_size}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модалка додавання запису */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Додати новий запис в {tableName}
                  </h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {columns.filter(col => !col.is_primary_key || !col.column_default?.includes('nextval')).map((column) => (
                    <div key={column.column_name}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {column.column_name}
                        {column.is_nullable === 'NO' && <span className="text-red-500">*</span>}
                        <span className="text-xs text-gray-500 ml-2">({column.data_type})</span>
                      </label>
                      <input
                        type={column.data_type.includes('int') || column.data_type.includes('numeric') ? 'number' : 
                              column.data_type.includes('bool') ? 'checkbox' : 
                              column.data_type.includes('date') || column.data_type.includes('timestamp') ? 'datetime-local' : 'text'}
                        value={newRecord[column.column_name] || ''}
                        checked={column.data_type.includes('bool') ? newRecord[column.column_name] : undefined}
                        onChange={(e) => setNewRecord({
                          ...newRecord,
                          [column.column_name]: column.data_type.includes('bool') ? e.target.checked : e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={column.column_default || `Введіть ${column.column_name}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleAddRecord}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Додавання...' : 'Додати'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-700"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}