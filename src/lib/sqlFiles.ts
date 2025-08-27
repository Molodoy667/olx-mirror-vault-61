// SQL Files Management Utilities

export interface SQLFile {
  name: string;
  content: string;
  size: number;
  lastModified: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  executionTime?: number;
}

// В реальной среде это бы работало с файловой системой
// Пока что возвращаем статические данные
export async function loadSQLFiles(): Promise<SQLFile[]> {
  try {
    // В production это бы был API вызов к серверу
    // Для демонстрации возвращаем статические файлы
    const staticFiles: SQLFile[] = [
      {
        name: 'example_analytics.sql',
        content: await getFileContent('example_analytics.sql'),
        size: 2048,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'seo_urls_setup.sql',
        content: await getFileContent('seo_urls_setup.sql'), 
        size: 1024,
        lastModified: new Date(Date.now() - 86400000).toISOString(),
        status: 'idle'
      },
      {
        name: 'apply_seo_migration.sql',
        content: await getFileContent('apply_seo_migration.sql'),
        size: 512,
        lastModified: new Date(Date.now() - 172800000).toISOString(), 
        status: 'idle'
      }
    ];

    return staticFiles;
  } catch (error) {
    console.error('Error loading SQL files:', error);
    return [];
  }
}

async function getFileContent(fileName: string): Promise<string> {
  // Статическое содержимое файлов для демонстрации
  const contents: { [key: string]: string } = {
    'example_analytics.sql': `-- Example Analytics Query
-- Анализ активности пользователей и объявлений

-- 1. Статистика пользователей по месяцам
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as users_count,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY month 
ORDER BY month DESC;

-- 2. Топ категории по количеству объявлений
SELECT 
  c.name as category_name,
  COUNT(l.*) as listings_count,
  COUNT(l.*) FILTER (WHERE l.status = 'active') as active_listings,
  ROUND(AVG(l.price), 2) as avg_price
FROM categories c
LEFT JOIN listings l ON c.id = l.category_id
GROUP BY c.id, c.name
ORDER BY listings_count DESC
LIMIT 10;`,

    'seo_urls_setup.sql': `-- SEO URLs Setup
-- Настройка SEO-дружественных URL

CREATE OR REPLACE FUNCTION setup_seo_urls() 
RETURNS void AS $$
BEGIN
  -- Создаем функцию для генерации slug
  CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
  RETURNS TEXT AS $func$
  BEGIN
    RETURN lower(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Z0-9а-яё\\s-]', '', 'gi'),
        '\\s+', '-', 'g'
      )
    );
  END;
  $func$ LANGUAGE plpgsql;

  -- Добавляем slug колонку к listings если не существует
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'slug'
  ) THEN
    ALTER TABLE listings ADD COLUMN slug TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
  END IF;

  -- Обновляем существующие записи
  UPDATE listings 
  SET slug = generate_slug(title || '-' || id::text)
  WHERE slug IS NULL;

END;
$$ LANGUAGE plpgsql;`,

    'apply_seo_migration.sql': `-- Apply SEO Migration
-- Применение SEO миграции

-- Запускаем настройку SEO URLs
SELECT setup_seo_urls();

-- Создаем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_listings_slug_status ON listings(slug, status);
CREATE INDEX IF NOT EXISTS idx_listings_category_slug ON listings(category_id, slug);

-- Добавляем триггер для автоматической генерации slug
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title || '-' || NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON listings;
CREATE TRIGGER trigger_auto_generate_slug 
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION auto_generate_slug();

-- Обновляем статистику таблиц
ANALYZE listings;

SELECT 'SEO migration applied successfully' as result;`
  };

  return contents[fileName] || `-- SQL file: ${fileName}
-- Content not available in demo mode
-- In production, this would load actual file content

SELECT 'File content would be loaded here' as demo_message;`;
}

export async function executeSQLFile(fileName: string, content: string): Promise<any> {
  // В реальной среде здесь бы был запрос к базе данных
  // Для демонстрации симулируем выполнение
  
  const startTime = Date.now();
  
  // Симуляция задержки выполнения
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const executionTime = Date.now() - startTime;
  
  // Симулируем различные результаты в зависимости от содержимого
  if (content.includes('SELECT')) {
    return {
      success: true,
      message: 'SELECT запрос выполнен успешно',
      rowsAffected: Math.floor(Math.random() * 100) + 1,
      executionTime,
      data: {
        rows: Math.floor(Math.random() * 50) + 1,
        columns: ['id', 'name', 'count']
      }
    };
  } else if (content.includes('CREATE')) {
    return {
      success: true, 
      message: 'Объекты базы данных созданы успешно',
      rowsAffected: 0,
      executionTime,
      data: {
        created: ['function', 'index', 'trigger']
      }
    };
  } else if (content.includes('UPDATE') || content.includes('INSERT')) {
    return {
      success: true,
      message: 'Данные обновлены успешно', 
      rowsAffected: Math.floor(Math.random() * 500) + 10,
      executionTime
    };
  } else {
    // Случайно симулируем ошибку
    if (Math.random() < 0.1) {
      throw new Error('Синтаксическая ошибка в SQL запросе');
    }
    
    return {
      success: true,
      message: 'SQL файл выполнен успешно',
      rowsAffected: Math.floor(Math.random() * 10),
      executionTime
    };
  }
}

export async function deleteSQLFile(fileName: string): Promise<void> {
  // В реальной среде здесь бы было удаление файла
  // Для демонстрации просто симулируем задержку
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (Math.random() < 0.05) {
    throw new Error('Не удалось удалить файл: файл используется другим процессом');
  }
}