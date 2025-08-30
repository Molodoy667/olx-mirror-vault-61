// Утилиты для очистки localStorage от избыточных данных

export function cleanupLocalStorage() {
  try {
    // Удаляем проблемные ключи которые могут занимать много места
    const keysToRemove = [
      'backup-list',        // Огромные бекапы сайта
      'backup-configs',     // Конфигурации бекапов
      'admin_settings',     // Дублирующиеся настройки
      'site-backup-data',   // Данные бекапов
      'database-backup',    // Бекапы БД
    ];

    let totalCleaned = 0;
    
    keysToRemove.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        const size = new Blob([item]).size;
        totalCleaned += size;
        localStorage.removeItem(key);
        console.log(`🗑️ Удален ${key}: ${formatBytes(size)}`);
      }
    });

    // Очищаем все ключи которые начинаются с backup-
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('backup-') || key.startsWith('admin-backup-')) {
        const item = localStorage.getItem(key);
        if (item) {
          const size = new Blob([item]).size;
          totalCleaned += size;
          localStorage.removeItem(key);
          console.log(`🗑️ Удален ${key}: ${formatBytes(size)}`);
        }
      }
    });

    console.log(`✅ Очищено localStorage: ${formatBytes(totalCleaned)}`);
    return totalCleaned;
    
  } catch (error) {
    console.error('Ошибка очистки localStorage:', error);
    return 0;
  }
}

export function getLocalStorageSize(): number {
  let total = 0;
  try {
    Object.keys(localStorage).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        total += new Blob([item]).size;
      }
    });
  } catch (error) {
    console.error('Ошибка подсчета размера localStorage:', error);
  }
  return total;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getLocalStorageReport(): { key: string; size: number; sizeFormatted: string }[] {
  const report: { key: string; size: number; sizeFormatted: string }[] = [];
  
  try {
    Object.keys(localStorage).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        const size = new Blob([item]).size;
        report.push({
          key,
          size,
          sizeFormatted: formatBytes(size)
        });
      }
    });
    
    // Сортируем по размеру (большие сначала)
    report.sort((a, b) => b.size - a.size);
  } catch (error) {
    console.error('Ошибка создания отчета localStorage:', error);
  }
  
  return report;
}