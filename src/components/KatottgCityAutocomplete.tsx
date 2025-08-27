import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface KatottgCity {
  code: string;
  name: string;
  type: string;
  region?: string;
  district?: string;
  fullName: string;
}

interface KatottgCityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showRegionsOnEmpty?: boolean;
}

export function KatottgCityAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Оберіть місто...",
  className,
  showRegionsOnEmpty = true  // По умолчанию показываем области
}: KatottgCityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [cities, setCities] = useState<KatottgCity[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Принудительно загружаем регионы при открытии если showRegionsOnEmpty=true
  const handlePopoverOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && showRegionsOnEmpty && searchValue === '' && cities.length === 0) {
      console.log('KatottgCityAutocomplete: Popover opened, forcing regions load...');
      // Триггерим загрузку через изменение searchValue и сразу возвращаем обратно
      setSearchValue(' ');
      setTimeout(() => setSearchValue(''), 0);
    }
  };

  // Функция клиентской сортировки (как в тестовой версии что работала)
  const sortCitiesByPriority = (cities: KatottgCity[], query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    
    return cities.sort((a, b) => {
      // Точные совпадения первые
      const aExact = a.name.toLowerCase() === normalizedQuery;
      const bExact = b.name.toLowerCase() === normalizedQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Приоритет по типу: области > районы > города > ПГТ > поселки > села
      const getTypePriority = (type: string) => {
        switch(type) {
          case 'обл.': return 1; // области ПЕРВЫЕ
          case 'р-н': return 2;  // районы ВТОРЫЕ  
          case 'м.': return 3;   // города ТРЕТЬИ
          case 'смт': return 4;  // ПГТ четвертые
          case 'с-ще': return 5; // поселки пятые
          case 'с.': return 6;   // села последние
          default: return 7;
        }
      };
      
      const aPriority = getTypePriority(a.type);
      const bPriority = getTypePriority(b.type);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // В рамках одного типа - по алфавиту
      return a.name.localeCompare(b.name, 'uk');
    });
  };

  useEffect(() => {
    const fetchCities = async () => {
      // Если запрос короткий и не показываем области, ничего не показываем
      if (!showRegionsOnEmpty && searchValue.length < 2) {
        setCities([]);
        return;
      }

      // Если показываем области и поле пустое - вызываем функцию с пустым запросом
      // Если запрос короткий (менее 2 символов) и не пустой - не показываем ничего
      if (searchValue.length > 0 && searchValue.length < 2) {
        setCities([]);
        return;
      }

      setLoading(true);
      try {
        console.log(`KatottgCityAutocomplete: Fetching cities for query: "${searchValue}", showRegionsOnEmpty: ${showRegionsOnEmpty}`);
        
        // Вызываем edge функцию для получения реальных данных
        const { data, error } = await supabase.functions.invoke('katottg-cities', {
          body: { query: searchValue }
        });

        if (error) {
          console.error('Error fetching cities:', error);
          toast({
            title: "Помилка",
            description: "Не вдалося завантажити міста",
            variant: "destructive",
          });
          setCities([]);
          return;
        }

        const rawCities = data.cities || [];
        console.log(`KatottgCityAutocomplete: Received ${rawCities.length} cities from Edge Function`);
        
        // Применяем клиентскую сортировку поверх данных от сервера
        // Это гарантирует правильный порядок независимо от серверной сортировки
        const sortedCities = sortCitiesByPriority(rawCities, searchValue);
        console.log(`KatottgCityAutocomplete: After sorting: ${sortedCities.length} cities`);
        
        setCities(sortedCities);

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити міста",
          variant: "destructive",
        });
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(fetchCities, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchValue, showRegionsOnEmpty, toast]);

  const handleCitySelect = async (city: KatottgCity) => {
    onChange(city.fullName);
    setOpen(false);

    // Отслеживаем поиск города
    try {
      await supabase.functions.invoke('track-search', {
        body: { 
          query: city.fullName,
          queryType: 'location'
        }
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={handlePopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between text-left font-normal", className)}
        >
          <div className="flex items-center min-w-0 flex-1">
            <MapPin className="w-4 h-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {value || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[95vw] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Введіть назву населеного пункту..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {loading ? "Завантаження..." : "Населені пункти не знайдено"}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {cities.map((city) => (
              <CommandItem
                key={city.code}
                value={city.fullName}
                onSelect={() => handleCitySelect(city)}
                className="flex items-start gap-2 p-3"
              >
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    value === city.fullName ? "opacity-100" : "opacity-0"
                  )}
                />
                <MapPin className="mt-0.5 w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium truncate">
                    {city.type} {city.name}
                  </span>
                  {city.region && (
                    <span className="text-sm text-muted-foreground truncate">
                      {city.region}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}