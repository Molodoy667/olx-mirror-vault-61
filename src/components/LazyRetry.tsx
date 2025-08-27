import { lazy, ComponentType } from 'react';

// Функция для retry lazy loading с обработкой ошибок
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  const loadWithRetry = async (retriesLeft: number): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (retriesLeft > 0) {
        console.warn(`Lazy loading failed, retrying... (${retriesLeft} attempts left)`, error);
        // Небольшая задержка перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadWithRetry(retriesLeft - 1);
      }
      
      // Если все попытки исчерпаны, показываем fallback компонент
      console.error('Lazy loading failed after all retries:', error);
      
      // Возвращаем fallback компонент
      const FallbackComponent: T = (() => (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-destructive text-2xl">⚠️</div>
            <h2 className="text-xl font-semibold text-foreground">
              Помилка завантаження
            </h2>
            <p className="text-muted-foreground">
              Не вдалося завантажити сторінку. Спробуйте оновити сторінку.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Оновити сторінку
            </button>
          </div>
        </div>
      )) as T;
      
      return { default: FallbackComponent };
    }
  };

  return lazy(() => loadWithRetry(retries));
}