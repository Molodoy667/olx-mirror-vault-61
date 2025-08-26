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
  showRegionsOnEmpty?: boolean; // Нова опція для показу областей
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

  useEffect(() => {
    const fetchCities = async () => {
      // Тестовые данные для проверки сортировки
      const testData: KatottgCity[] = [
        { code: 'test1', name: 'Львів', type: 'м.', region: 'Львівська', fullName: 'м. Львів, Львівська область' },
        { code: 'test2', name: 'Львівка', type: 'с.', region: 'Київська', fullName: 'с. Львівка, Київська область' },
        { code: 'test3', name: 'Львівська', type: 'обл.', region: 'Львівська', fullName: 'Львівська область' },
        { code: 'test4', name: 'Львівський', type: 'р-н', region: 'Львівська', fullName: 'Львівський район' },
        { code: 'test5', name: 'Львово', type: 'смт', region: 'Закарпатська', fullName: 'смт Львово, Закарпатська область' },
      ];

      // Если пустой запрос и showRegionsOnEmpty true, показываем области
      if (searchValue.length === 0 && showRegionsOnEmpty) {
        const regions: KatottgCity[] = [
          { code: 'r1', name: 'Київська', type: 'обл.', region: 'Київська', fullName: 'Київська область' },
          { code: 'r2', name: 'Львівська', type: 'обл.', region: 'Львівська', fullName: 'Львівська область' },
          { code: 'r3', name: 'Одеська', type: 'обл.', region: 'Одеська', fullName: 'Одеська область' },
          { code: 'r4', name: 'Харківська', type: 'обл.', region: 'Харківська', fullName: 'Харківська область' },
        ];
        setCities(regions);
        return;
      }

      // Якщо showRegionsOnEmpty false і запит короткий, не робимо запит
      if (!showRegionsOnEmpty && searchValue.length < 2) {
        setCities([]);
        return;
      }

      // Фильтруем и сортируем тестовые данные
      if (searchValue.length >= 2) {
        const normalizedQuery = searchValue.toLowerCase();
        const filtered = testData.filter(city => 
          city.name.toLowerCase().includes(normalizedQuery) ||
          city.region?.toLowerCase().includes(normalizedQuery)
        );

        // Сортировка по приоритету
        const sorted = filtered.sort((a, b) => {
          // Exact matches first
          const aExact = a.name.toLowerCase() === normalizedQuery;
          const bExact = b.name.toLowerCase() === normalizedQuery;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Priority by type
          const getTypePriority = (type: string) => {
            switch(type) {
              case 'обл.': return 1;
              case 'р-н': return 2;
              case 'м.': return 3;
              case 'смт': return 4;
              case 'с-ще': return 5;
              case 'с.': return 6;
              default: return 7;
            }
          };
          
          const aPriority = getTypePriority(a.type);
          const bPriority = getTypePriority(b.type);
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          return a.name.localeCompare(b.name, 'uk');
        });

        setCities(sorted);
      } else {
        setCities([]);
      }
    };

    const debounceTimeout = setTimeout(fetchCities, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchValue, showRegionsOnEmpty]);

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
    <Popover open={open} onOpenChange={setOpen}>
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