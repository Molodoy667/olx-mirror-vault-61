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
      // Якщо showRegionsOnEmpty true або запит довший за 0 символів
      if (!showRegionsOnEmpty && searchValue.length < 2) {
        setCities([]);
        return;
      }

      setLoading(true);
      try {
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

        setCities(data.cities || []);
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