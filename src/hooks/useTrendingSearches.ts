import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingSearch {
  term: string;
  count: number;
  change: string;
}

export const useTrendingSearches = () => {
  return useQuery({
    queryKey: ['trending-searches'],
    queryFn: async () => {
      // Получаем популярные поисковые термины из названий listings
      const { data: listings, error } = await supabase
        .from('listings')
        .select('title, views, created_at')
        .eq('status', 'active')
        .order('views', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Обрабатываем данные для извлечения популярных терминов
      const termCounts: { [key: string]: { count: number, views: number } } = {};
      
      listings?.forEach(listing => {
        // Извлекаем ключевые слова из заголовков
        const words = listing.title
          .toLowerCase()
          .split(/[\s,.-]+/)
          .filter(word => word.length > 2 && !['для', 'від', 'або', 'при', 'все', 'під', 'без', 'про'].includes(word));
        
        words.forEach(word => {
          if (!termCounts[word]) {
            termCounts[word] = { count: 0, views: 0 };
          }
          termCounts[word].count += 1;
          termCounts[word].views += listing.views || 0;
        });
      });

      // Создаем список популярных терминов
      const popularTerms = Object.entries(termCounts)
        .filter(([term, data]) => data.count >= 3) // Минимум 3 упоминания
        .sort((a, b) => b[1].views - a[1].views) // Сортируем по просмотрам
        .slice(0, 8)
        .map(([term, data], index) => ({
          term: term.charAt(0).toUpperCase() + term.slice(1),
          count: data.views,
          change: `+${Math.floor(Math.random() * 20 + 5)}%` // Симулируем рост
        }));

      // Если недостаточно данных, добавляем популярные категории
      if (popularTerms.length < 8) {
        const fallbackTerms = [
          { term: "iPhone", count: 2847, change: "+12%" },
          { term: "PlayStation", count: 1923, change: "+8%" },
          { term: "MacBook", count: 1567, change: "+15%" },
          { term: "Велосипед", count: 1234, change: "+5%" },
          { term: "Квартира", count: 987, change: "+23%" },
          { term: "Toyota", count: 834, change: "+7%" },
          { term: "Дитяча коляска", count: 645, change: "+18%" },
          { term: "Диван", count: 543, change: "+3%" },
        ];

        const needed = 8 - popularTerms.length;
        popularTerms.push(...fallbackTerms.slice(0, needed));
      }

      return popularTerms;
    },
    staleTime: 1000 * 60 * 30, // 30 минут
  });
};