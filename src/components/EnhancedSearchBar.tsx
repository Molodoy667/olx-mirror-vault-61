import { Search, MapPin, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SearchSuggestions } from "./SearchSuggestions";
import { Badge } from "./ui/badge";
import { LocationSearchDialog } from "./LocationSearchDialog";
import { NovaPoshtaCityAutocomplete } from "./NovaPoshtaCityAutocomplete";
import { KatottgCityAutocomplete } from "./KatottgCityAutocomplete";

interface QuickFilter {
  label: string;
  value: string;
  active: boolean;
}

export function EnhancedSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([
    { label: "З фото", value: "with_photo", active: false },
    { label: "Новий", value: "new", active: false },
    { label: "VIP", value: "promoted", active: false },
    { label: "Торг", value: "negotiable", active: false },
  ]);

  // Закрываем подсказки при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    
    // Добавляем активные фильтры
    quickFilters.forEach(filter => {
      if (filter.active) {
        params.set(filter.value, 'true');
      }
    });
    
    navigate(`/search?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    // Автоматически выполняем поиск
    setTimeout(() => {
      const params = new URLSearchParams();
      params.set('q', suggestion);
      if (location) params.set('location', location);
      
      quickFilters.forEach(filter => {
        if (filter.active) {
          params.set(filter.value, 'true');
        }
      });
      
      navigate(`/search?${params.toString()}`);
    }, 100);
  };

  const toggleQuickFilter = (index: number) => {
    setQuickFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, active: !filter.active } : filter
      )
    );
  };

  const clearQuickFilters = () => {
    setQuickFilters(prev => 
      prev.map(filter => ({ ...filter, active: false }))
    );
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 to-primary-dark/5 py-6 border-b">
      <div className="container mx-auto px-4">
        {/* Основная строка поиска */}
        <div ref={searchRef} className="relative">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            {/* Поле поиска */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
              <Input 
                type="text" 
                placeholder="Що шукаєте? Наприклад: iPhone 13 Pro Max"
                className="pl-10 h-12 text-lg border-border bg-background shadow-sm focus:shadow-md transition-shadow"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 z-10"
                  onClick={() => {
                    setQuery("");
                    setShowSuggestions(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              
              {/* Подсказки поиска */}
              <SearchSuggestions
                query={query}
                onSuggestionClick={handleSuggestionClick}
                isVisible={showSuggestions}
              />
            </div>

            {/* Выбор локации */}
            <div className="md:w-80">
              <KatottgCityAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Оберіть населений пункт або область"
                className="h-12 text-lg"
                showRegionsOnEmpty={true}
              />
            </div>

            {/* Кнопка поиска */}
            <Button 
              type="submit" 
              className="h-12 px-8 text-lg bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg transition-all duration-200"
            >
              <Search className="w-5 h-5 mr-2" />
              Пошук
            </Button>
          </form>
        </div>

        {/* Быстрые фильтры */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Швидкі фільтри:</span>
          </div>
          
          {quickFilters.map((filter, index) => (
            <Badge
              key={filter.value}
              variant={filter.active ? "default" : "outline"}
              className="cursor-pointer hover:shadow-sm transition-all duration-200"
              onClick={() => toggleQuickFilter(index)}
            >
              {filter.label}
            </Badge>
          ))}
          
          {quickFilters.some(f => f.active) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearQuickFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Очистити
            </Button>
          )}
        </div>

        {/* Диалог выбора локации */}
        <LocationSearchDialog
          isOpen={showLocationDialog}
          onClose={() => setShowLocationDialog(false)}
          onLocationSelect={(selectedLocation) => {
            setLocation(selectedLocation);
            setShowLocationDialog(false);
          }}
          currentLocation={location}
        />
      </div>
    </div>
  );
}