import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Zap, DollarSign, Camera, Clock } from "lucide-react";

interface QuickFiltersProps {
  filters: any;
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
}

const quickFilterOptions = [
  {
    key: 'isPromoted',
    label: 'Промо оголошення',
    icon: Zap,
    activeColor: 'bg-yellow-500 hover:bg-yellow-600'
  },
  {
    key: 'hasImages',
    label: 'З фото',
    icon: Camera,
    activeColor: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    key: 'freeItems',
    label: 'Безкоштовно',
    icon: DollarSign,
    activeColor: 'bg-green-500 hover:bg-green-600'
  },
  {
    key: 'recentlyAdded',
    label: 'Нові (24 год)',
    icon: Clock,
    activeColor: 'bg-purple-500 hover:bg-purple-600'
  }
];

export const QuickFilters = ({ filters, onFilterChange, onClearAll }: QuickFiltersProps) => {
  const hasActiveFilters = Object.values(filters).some(value => value);

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground mr-2">
        Швидкі фільтри:
      </span>
      
      {quickFilterOptions.map(({ key, label, icon: Icon, activeColor }) => {
        const isActive = filters[key];
        
        return (
          <Button
            key={key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(key, !isActive)}
            className={`h-8 ${isActive ? activeColor : 'hover:bg-accent'} transition-all duration-200`}
          >
            <Icon className="w-3 h-3 mr-1" />
            <span className="text-xs">{label}</span>
          </Button>
        );
      })}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 text-destructive hover:bg-destructive/10 ml-2"
        >
          <X className="w-3 h-3 mr-1" />
          <span className="text-xs">Очистити</span>
        </Button>
      )}
    </div>
  );
};