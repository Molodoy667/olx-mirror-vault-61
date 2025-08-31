import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePopularSearches } from '@/hooks/usePopularSearches';

interface SearchSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
  isVisible: boolean;
}

export const SearchSuggestions = ({ query, onSuggestionClick, isVisible }: SearchSuggestionsProps) => {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Получаем популярные поисковые запросы из статистики
  const { data: popularSearches } = usePopularSearches('search', 8);

  // Получаем подсказки на основе поиска по базе
  const { data: autocompleteSuggestions } = useQuery({
    queryKey: ['autocomplete', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('listings')
        .select('title')
        .eq('status', 'active')
        .ilike('title', `%${query}%`)
        .limit(5);
      
      if (error) return [];
      
      // Извлекаем уникальные ключевые слова из заголовков
      const suggestions = new Set<string>();
      data.forEach(listing => {
        const words = listing.title.split(' ').filter(word => 
          word.length > 2 && 
          word.toLowerCase().includes(query.toLowerCase())
        );
        words.forEach(word => suggestions.add(word));
      });
      
      return Array.from(suggestions).slice(0, 8);
    },
    enabled: query.length >= 2,
  });

  // Загружаем недавние поиски из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Сохраняем поиск в недавние и отслеживаем статистику
  const saveRecentSearch = async (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    
    // Проверяем размер перед сохранением
    const dataToSave = JSON.stringify(updated);
    if (new Blob([dataToSave]).size > 20 * 1024) { // Больше 20KB
      // Ограничиваем до 3 элементов если данные слишком большие
      const limited = updated.slice(0, 3);
      setRecentSearches(limited);
      localStorage.setItem('recentSearches', JSON.stringify(limited));
    } else {
      localStorage.setItem('recentSearches', dataToSave);
    }

    // Отслеживаем поиск в статистике
    try {
      await supabase.functions.invoke('track-search', {
        body: { 
          query: searchQuery,
          queryType: 'search'
        }
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  };

  // Удаляем из недавних поисков
  const removeRecentSearch = (searchQuery: string) => {
    const updated = recentSearches.filter(s => s !== searchQuery);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await saveRecentSearch(suggestion);
    onSuggestionClick(suggestion);
  };

  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-card border border-t-0 rounded-b-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {/* Автодополнение */}
      {autocompleteSuggestions && autocompleteSuggestions.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Підказки
          </h4>
          <div className="space-y-1">
            {autocompleteSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto p-2 text-left"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Недавние поиски */}
      {recentSearches.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Недавні пошуки
          </h4>
          <div className="space-y-1">
            {recentSearches.map((search, index) => (
              <div key={index} className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start h-auto p-2 text-left"
                  onClick={() => handleSuggestionClick(search)}
                >
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  {search}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRecentSearch(search)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Популярные поиски */}
      {popularSearches && popularSearches.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Популярні пошуки
          </h4>
          <div className="flex flex-wrap gap-2">
            {popularSearches?.map((search, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleSuggestionClick(search.term)}
              >
                {search.trending && <TrendingUp className="w-3 h-3 mr-1" />}
                {search.term}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Если нет подсказок */}
      {(!autocompleteSuggestions || autocompleteSuggestions.length === 0) && 
       recentSearches.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Введіть запит для пошуку</p>
        </div>
      )}
    </div>
  );
};