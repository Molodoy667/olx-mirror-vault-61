import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollListRef {
  scrollToItem: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

export const VirtualScrollList = React.forwardRef<VirtualScrollListRef, VirtualScrollListProps<any>>(
  function VirtualScrollList<T>({
    items,
    itemHeight,
    containerHeight,
    renderItem,
    className,
    overscan = 3,
    onScroll
  }: VirtualScrollListProps<T>, ref) {
    const [scrollTop, setScrollTop] = useState(0);
    const scrollElementRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    };

    // Calculate visible range
    const { visibleRange, totalHeight } = useMemo(() => {
      const visibleStart = Math.floor(scrollTop / itemHeight);
      const visibleEnd = Math.min(
        visibleStart + Math.ceil(containerHeight / itemHeight),
        items.length - 1
      );

      // Add overscan items
      const startIndex = Math.max(0, visibleStart - overscan);
      const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

      return {
        visibleRange: { startIndex, endIndex },
        totalHeight: items.length * itemHeight
      };
    }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

    // Generate visible items
    const visibleItems = useMemo(() => {
      const items_to_render = [];
      for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
        items_to_render.push({
          index: i,
          item: items[i],
          top: i * itemHeight
        });
      }
      return items_to_render;
    }, [items, visibleRange, itemHeight]);

    // Scroll to specific item
    const scrollToItem = (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (!scrollElementRef.current) return;

      let scrollTo;
      switch (align) {
        case 'start':
          scrollTo = index * itemHeight;
          break;
        case 'center':
          scrollTo = index * itemHeight - containerHeight / 2 + itemHeight / 2;
          break;
        case 'end':
          scrollTo = index * itemHeight - containerHeight + itemHeight;
          break;
      }

      scrollElementRef.current.scrollTo({
        top: Math.max(0, Math.min(scrollTo, totalHeight - containerHeight)),
        behavior: 'smooth'
      });
    };

    // Expose scroll methods
    React.useImperativeHandle(ref, () => ({
      scrollToItem,
      scrollToTop: () => scrollElementRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
      scrollToBottom: () => scrollElementRef.current?.scrollTo({ 
        top: totalHeight, 
        behavior: 'smooth' 
      })
    }));

    return (
      <div
        ref={scrollElementRef}
        className={cn("overflow-auto", className)}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* Total container to maintain scroll height */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Render only visible items */}
          {visibleItems.map(({ index, item, top }) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top,
                height: itemHeight,
                width: '100%'
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

// Hook for easier usage with dynamic item heights
export function useVirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      startIndex: Math.max(0, visibleStart - 3),
      endIndex: Math.min(items.length - 1, visibleEnd + 3)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleRange,
    totalHeight,
    scrollTop,
    setScrollTop
  };
}