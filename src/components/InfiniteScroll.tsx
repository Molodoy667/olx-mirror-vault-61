import { useEffect, useRef, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface InfiniteScrollProps {
  children: React.ReactNode;
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  loadingText?: string;
}

export function InfiniteScroll({
  children,
  hasNextPage,
  isLoading,
  onLoadMore,
  threshold = 0.8,
  loadingText = "Завантаження..."
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isLoading) {
      onLoadMore();
    }
  }, [hasNextPage, isLoading, onLoadMore]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleIntersect, threshold]);

  return (
    <>
      {children}
      
      {hasNextPage && (
        <div 
          ref={observerTarget} 
          className="flex justify-center py-8"
        >
          {isLoading && (
            <LoadingSpinner size="md" text={loadingText} />
          )}
        </div>
      )}
      
      {!hasNextPage && (
        <div className="text-center py-8 text-muted-foreground">
          Більше оголошень немає
        </div>
      )}
    </>
  );
}