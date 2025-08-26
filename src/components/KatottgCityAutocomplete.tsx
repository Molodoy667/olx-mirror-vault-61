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

  useEffect(() => {
    const fetchCities = async () => {
      // Простые тестовые данные для проверки сортировки
      const allData: KatottgCity[] = [
        // Области (показываем по умолчанию)
        { code: 'r1', name: 'Київська', type: 'обл.', region: 'Київська', fullName: 'Київська область' },
        { code: 'r2', name: 'Львівська', type: 'обл.', region: 'Львівська', fullName: 'Львівська область' },
        { code: 'r3', name: 'Одеська', type: 'обл.', region: 'Одеська', fullName: 'Одеська область' },
        { code: 'r4', name: 'Харківська', type: 'обл.', region: 'Харківська', fullName: 'Харківська область' },
        { code: 'r5', name: 'Дніпропетровська', type: 'обл.', region: 'Дніпропетровська', fullName: 'Дніпропетровська область' },
        { code: 'r6', name: 'Запорізька', type: 'обл.', region: 'Запорізька', fullName: 'Запорізька область' },
        { code: 'r7', name: 'Полтавська', type: 'обл.', region: 'Полтавська', fullName: 'Полтавська область' },
        { code: 'r8', name: 'Вінницька', type: 'обл.', region: 'Вінницька', fullName: 'Вінницька область' },
        
        // Львов данные для тестирования приоритетной сортировки
        { code: 'c1', name: 'Львів', type: 'м.', region: 'Львівська', fullName: 'м. Львів, Львівська область' },
        { code: 'd1', name: 'Львівський', type: 'р-н', region: 'Львівська', fullName: 'Львівський район' },
        { code: 't1', name: 'Львово', type: 'смт', region: 'Закарпатська', fullName: 'смт Львово, Закарпатська область' },
        { code: 's1', name: 'Львівка', type: 'с.', region: 'Київська', fullName: 'с. Львівка, Київська область' },
        
        // Киев данные
        { code: 'c2', name: 'Київ', type: 'м.', region: 'Київська', fullName: 'м. Київ, Київська область' },
        { code: 'd2', name: 'Київський', type: 'р-н', region: 'Київська', fullName: 'Київський район' },
        { code: 's2', name: 'Київка', type: 'с.', region: 'Полтавська', fullName: 'с. Київка, Полтавська область' },
        
        // Другие крупные города
        { code: 'c3', name: 'Одеса', type: 'м.', region: 'Одеська', fullName: 'м. Одеса, Одеська область' },
        { code: 'c4', name: 'Харків', type: 'м.', region: 'Харківська', fullName: 'м. Харків, Харківська область' },
        { code: 'c5', name: 'Дніпро', type: 'м.', region: 'Дніпропетровська', fullName: 'м. Дніпро, Дніпропетровська область' },
      ];

      // Если пустой запрос и showRegionsOnEmpty true, показываем только области
      if (searchValue.length === 0 && showRegionsOnEmpty) {
        const regions = allData.filter(item => item.type === 'обл.');
        setCities(regions);
        return;
      }

      // Если запрос короткий и не показываем области, ничего не показываем
      if (!showRegionsOnEmpty && searchValue.length < 2) {
        setCities([]);
        return;
      }

      // Фильтруем по запросу (от 2 символов)
      if (searchValue.length >= 2) {
        const normalizedQuery = searchValue.toLowerCase();
        const filtered = allData.filter(city => 
          city.name.toLowerCase().includes(normalizedQuery) ||
          city.region?.toLowerCase().includes(normalizedQuery)
        );

        // ★★★ СОРТИРОВКА ПО ПРИОРИТЕТУ (КАК ВЫ ПРОСИЛИ!) ★★★
        const sorted = filtered.sort((a, b) => {
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
                  <span className="text-xs text-orange-500 ml-2">
                    [ПРИОРИТЕТ: {city.type}]
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