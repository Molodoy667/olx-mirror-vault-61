import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Save, Bell, BellOff, Search, MapPin, DollarSign } from "lucide-react";
import { useCreateSavedSearch, SavedSearchFilters } from "@/hooks/useSavedSearches";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SaveSearchDialogProps {
  filters: SavedSearchFilters;
  children?: React.ReactNode;
  className?: string;
}

export function SaveSearchDialog({ filters, children, className }: SaveSearchDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const createSavedSearch = useCreateSavedSearch();

  const handleSave = async () => {
    if (!searchName.trim()) return;

    try {
      await createSavedSearch.mutateAsync({
        name: searchName.trim(),
        filters,
        notificationsEnabled,
      });
      
      setIsOpen(false);
      setSearchName("");
      setNotificationsEnabled(true);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const getFilterSummary = () => {
    const summary = [];
    
    if (filters.query) {
      summary.push({ label: 'Пошук', value: filters.query, icon: Search });
    }
    
    if (filters.location) {
      summary.push({ label: 'Локація', value: filters.location, icon: MapPin });
    }
    
    if (filters.minPrice || filters.maxPrice) {
      const priceRange = `${filters.minPrice || 0} - ${filters.maxPrice || '∞'} грн`;
      summary.push({ label: 'Ціна', value: priceRange, icon: DollarSign });
    }
    
    if (filters.condition) {
      summary.push({ label: 'Стан', value: filters.condition });
    }
    
    if (filters.onlyWithPhoto) {
      summary.push({ label: 'Тільки з фото', value: 'Так' });
    }
    
    if (filters.onlyPromoted) {
      summary.push({ label: 'Тільки промо', value: 'Так' });
    }

    return summary;
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            className={cn("gap-2", className)}
          >
            <Save className="w-4 h-4" />
            Зберегти пошук
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-primary" />
            Зберегти пошук
          </DialogTitle>
          <DialogDescription>
            Збережіть цей пошук та отримуйте сповіщення про нові оголошення
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Name */}
          <div className="space-y-2">
            <Label htmlFor="searchName">Назва збереженого пошуку</Label>
            <Input
              id="searchName"
              placeholder="Наприклад: iPhone в Києві"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {notificationsEnabled ? (
                <Bell className="w-4 h-4 text-primary" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Сповіщення</p>
                <p className="text-xs text-muted-foreground">
                  Отримувати сповіщення про нові оголошення
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          {/* Filter Summary */}
          <div className="space-y-2">
            <Label>Параметри пошуку</Label>
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto">
              {getFilterSummary().map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {item.icon && <item.icon className="w-3 h-3 text-muted-foreground" />}
                    <span className="text-muted-foreground">{item.label}:</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.value}
                  </Badge>
                </div>
              ))}
              
              {getFilterSummary().length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Всі оголошення без фільтрів
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={!searchName.trim() || createSavedSearch.isPending}
              className="flex-1"
            >
              {createSavedSearch.isPending ? "Збереження..." : "Зберегти"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Скасувати
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}