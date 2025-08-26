import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PopularSearch {
  term: string;
  count: number;
  trending?: boolean;
}

export const usePopularSearches = (queryType: 'search' | 'location' = 'search', limit = 8) => {
  return useQuery({
    queryKey: ['popular-searches', queryType, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_queries')
        .select('query_text')
        .eq('query_type', queryType)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // За последние 30 дней
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching popular searches:', error);
        throw error;
      }

      // Подсчитываем частоту запросов
      const queryCount: { [key: string]: number } = {};
      data?.forEach(item => {
        const query = item.query_text.toLowerCase().trim();
        if (query.length > 1) {
          queryCount[query] = (queryCount[query] || 0) + 1;
        }
      });

      // Создаем список популярных запросов
      const popularSearches = Object.entries(queryCount)
        .filter(([_, count]) => count >= 2) // Минимум 2 упоминания
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([term, count], index) => ({
          term: term.charAt(0).toUpperCase() + term.slice(1),
          count,
          trending: index < 3 // Первые 3 считаем трендовыми
        }));

      // Если недостаточно данных, добавляем популярные запросы по умолчанию
      if (popularSearches.length < limit) {
        const fallbackSearches = queryType === 'location' 
          ? [
              { term: "Київ", count: 1234, trending: true },
              { term: "Львів", count: 987, trending: true },
              { term: "Харків", count: 765, trending: false },
              { term: "Одеса", count: 654, trending: true },
              { term: "Дніпро", count: 543, trending: false },
              { term: "Запоріжжя", count: 432, trending: false },
              { term: "Вінниця", count: 321, trending: false },
              { term: "Полтава", count: 210, trending: false },
            ]
          : [
              { term: "iPhone", count: 2847, trending: true },
              { term: "PlayStation", count: 1923, trending: true },
              { term: "MacBook", count: 1567, trending: false },
              { term: "Велосипед", count: 1234, trending: true },
              { term: "Квартира", count: 987, trending: false },
              { term: "Toyota", count: 834, trending: false },
              { term: "Диван", count: 645, trending: false },
              { term: "Ноутбук", count: 543, trending: false },
            ];

        const needed = limit - popularSearches.length;
        popularSearches.push(...fallbackSearches.slice(0, needed));
      }

      return popularSearches;
    },
    staleTime: 1000 * 60 * 15, // 15 минут
  });
};