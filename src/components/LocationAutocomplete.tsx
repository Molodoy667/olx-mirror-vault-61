import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Оберіть місто...",
  className 
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', searchValue],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select('location')
        .eq('status', 'active')
        .limit(1000);

      if (searchValue) {
        query = query.ilike('location', `%${searchValue}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Get unique locations and sort them
      const uniqueLocations = Array.from(
        new Set(data?.map(item => item.location).filter(Boolean))
      ).sort();

      return uniqueLocations;
    },
    enabled: open || searchValue.length > 0,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
            {value || placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Пошук міста..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>Міста не знайдено</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {locations.map((location) => (
              <CommandItem
                key={location}
                value={location}
                onSelect={() => {
                  onChange(location === value ? "" : location);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === location ? "opacity-100" : "opacity-0"
                  )}
                />
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                {location}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}