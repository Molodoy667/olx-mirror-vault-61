import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Navigation } from "lucide-react";
import { usePopularSearches } from "@/hooks/usePopularSearches";
import { supabase } from "@/integrations/supabase/client";

interface LocationSearchDialogProps {
  onLocationSelect: (location: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  currentLocation?: string;
}

const regions = [
  "Київська область", "Львівська область", "Дніпропетровська область",
  "Харківська область", "Одеська область", "Запорізька область",
  "Вінницька область", "Полтавська область", "Чернігівська область"
];

export function LocationSearchDialog({ 
  onLocationSelect, 
  isOpen: externalIsOpen, 
  onClose: externalOnClose,
  currentLocation = ""
}: LocationSearchDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Получаем популярные города из статистики
  const { data: popularCities } = usePopularSearches('location', 15);
  
  // Используем внешний или внутренний state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose ? externalOnClose : setInternalIsOpen;

  const filteredCities = popularCities?.filter(city =>
    city.term.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredRegions = regions.filter(region =>
    region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocationClick = async (location: string) => {
    // Отслеживаем выбор локации
    try {
      await supabase.functions.invoke('track-search', {
        body: { 
          query: location,
          queryType: 'location'
        }
      });
    } catch (error) {
      console.error('Error tracking location search:', error);
    }

    onLocationSelect(location);
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
    setSearchQuery("");
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // В реальному додатку тут би був запит до API для отримання назви міста
          onLocationSelect("Поточне місцезнаходження");
          if (externalOnClose) {
            externalOnClose();
          } else {
            setInternalIsOpen(false);
          }
        },
        (error) => {
          console.error("Помилка визначення локації:", error);
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (externalOnClose && !open) {
        externalOnClose();
      } else {
        setInternalIsOpen(open);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MapPin className="w-4 h-4" />
          Вибрати регіон
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Оберіть місцезнаходження</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-auto">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Пошук міста або області..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Current Location */}
          <Button
            variant="outline"
            onClick={handleCurrentLocation}
            className="w-full justify-start gap-2"
          >
            <Navigation className="w-4 h-4 text-primary" />
            Використати поточне місцезнаходження
          </Button>

          {/* All Ukraine Option */}
          <Button
            variant="ghost"
            onClick={() => handleLocationClick("Вся Україна")}
            className="w-full justify-start"
          >
            Вся Україна
          </Button>

          {/* Popular Cities */}
          {(!searchQuery || filteredCities.length > 0) && (
            <div>
              <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                Популярні міста
              </h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {(searchQuery ? filteredCities : popularCities?.slice(0, 10) || []).map((city) => (
                  <Badge
                    key={city.term}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs whitespace-nowrap"
                    onClick={() => handleLocationClick(city.term)}
                  >
                    {city.term}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Regions */}
          {(!searchQuery || filteredRegions.length > 0) && (
            <div>
              <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                Області
              </h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {(searchQuery ? filteredRegions : regions.slice(0, 6)).map((region) => (
                  <Badge
                    key={region}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-xs whitespace-nowrap"
                    onClick={() => handleLocationClick(region)}
                  >
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {searchQuery && filteredCities.length === 0 && filteredRegions.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Місцезнаходження не знайдено</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}