import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Bell, 
  BellOff, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Play,
  MapPin,
  DollarSign,
  Tag,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { SavedSearch, useUpdateSavedSearch, useDeleteSavedSearch } from "@/hooks/useSavedSearches";
import { cn } from "@/lib/utils";

interface SavedSearchCardProps {
  savedSearch: SavedSearch & { categories?: { name: string; name_uk: string } };
}

export function SavedSearchCard({ savedSearch }: SavedSearchCardProps) {
  const navigate = useNavigate();
  const updateSavedSearch = useUpdateSavedSearch();
  const deleteSavedSearch = useDeleteSavedSearch();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRunSearch = () => {
    const params = new URLSearchParams();
    
    if (savedSearch.query) params.set('q', savedSearch.query);
    if (savedSearch.category_id) params.set('category', savedSearch.category_id);
    if (savedSearch.location) params.set('location', savedSearch.location);
    if (savedSearch.min_price) params.set('minPrice', savedSearch.min_price.toString());
    if (savedSearch.max_price) params.set('maxPrice', savedSearch.max_price.toString());
    if (savedSearch.condition) params.set('condition', savedSearch.condition);
    if (savedSearch.only_with_photo) params.set('onlyWithPhoto', 'true');
    if (savedSearch.only_promoted) params.set('onlyPromoted', 'true');
    
    navigate(`/search?${params.toString()}`);
  };

  const toggleNotifications = () => {
    updateSavedSearch.mutate({
      id: savedSearch.id,
      updates: { notifications_enabled: !savedSearch.notifications_enabled }
    });
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteSavedSearch.mutate(savedSearch.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const getSearchFilters = () => {
    const filters = [];
    
    if (savedSearch.query) {
      filters.push({ icon: Search, label: savedSearch.query });
    }
    
    if (savedSearch.categories) {
      filters.push({ 
        icon: Tag, 
        label: savedSearch.categories.name_uk || savedSearch.categories.name 
      });
    }
    
    if (savedSearch.location) {
      filters.push({ icon: MapPin, label: savedSearch.location });
    }
    
    if (savedSearch.min_price || savedSearch.max_price) {
      const price = `${savedSearch.min_price || 0} - ${savedSearch.max_price || '∞'} грн`;
      filters.push({ icon: DollarSign, label: price });
    }
    
    if (savedSearch.condition) {
      filters.push({ label: `Стан: ${savedSearch.condition}` });
    }
    
    if (savedSearch.only_with_photo) {
      filters.push({ label: 'З фото' });
    }
    
    if (savedSearch.only_promoted) {
      filters.push({ label: 'Промо' });
    }

    return filters;
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">{savedSearch.name}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              Створено {formatDistanceToNow(new Date(savedSearch.created_at), {
                addSuffix: true,
                locale: uk,
              })}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifications Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleNotifications}
              className={cn(
                "p-2 h-8 w-8",
                savedSearch.notifications_enabled ? "text-primary" : "text-muted-foreground"
              )}
            >
              {savedSearch.notifications_enabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRunSearch}>
                  <Play className="w-4 h-4 mr-2" />
                  Запустити пошук
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="w-4 h-4 mr-2" />
                  Редагувати
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className={showDeleteConfirm ? "text-destructive" : ""}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {showDeleteConfirm ? "Підтвердити видалення" : "Видалити"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Search Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {getSearchFilters().map((filter, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs flex items-center gap-1"
              >
                {filter.icon && <filter.icon className="w-3 h-3" />}
                {filter.label}
              </Badge>
            ))}
          </div>

          {/* Notifications Status */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {savedSearch.notifications_enabled ? (
                <>
                  <Bell className="w-3 h-3 text-green-500" />
                  <span>Сповіщення увімкнені</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3 h-3" />
                  <span>Сповіщення вимкнені</span>
                </>
              )}
            </div>

            <Button 
              onClick={handleRunSearch}
              size="sm"
              className="hover:scale-105 transition-transform duration-200"
            >
              <Play className="w-3 h-3 mr-1" />
              Пошук
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}