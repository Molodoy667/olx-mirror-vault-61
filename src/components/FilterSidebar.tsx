import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { NovaPoshtaCityAutocomplete } from "./NovaPoshtaCityAutocomplete";
import { KatottgCityAutocomplete } from "./KatottgCityAutocomplete";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Record<string, unknown>) => void;
  categories?: string[];
}

export const FilterSidebar = ({
  isOpen,
  onClose,
  onApplyFilters,
  categories = [],
}: FilterSidebarProps) => {
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [condition, setCondition] = useState("any");
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(false);
  const [onlyPromoted, setOnlyPromoted] = useState(false);
  const [location, setLocation] = useState("");

  const handleApply = () => {
    onApplyFilters({
      priceRange,
      category: selectedCategory === "all" ? "" : selectedCategory,
      condition: condition === "any" ? "" : condition,
      onlyWithPhoto,
      onlyPromoted,
      location,
    });
  };

  const handleReset = () => {
    setPriceRange([0, 100000]);
    setSelectedCategory("all");
    setCondition("any");
    setOnlyWithPhoto(false);
    setOnlyPromoted(false);
    setLocation("");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 bg-background shadow-xl z-50",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Фільтри</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:rotate-90 transition-transform duration-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Price Range */}
            <div className="space-y-3">
              <Label>Діапазон цін (UAH)</Label>
              <div className="space-y-2">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                    className="w-full"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Category */}
            <div className="space-y-3">
              <Label>Категорія</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі категорії</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            {/* Condition */}
            <div className="space-y-3">
              <Label>Стан</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть стан" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Будь-який</SelectItem>
                  <SelectItem value="new">Новий</SelectItem>
                  <SelectItem value="used">Б/в</SelectItem>
                  <SelectItem value="refurbished">Відновлений</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            {/* Location */}
            <div className="space-y-3">
              <Label>Місцезнаходження</Label>
              <KatottgCityAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="Оберіть населений пункт або область"
                className="w-full"
                showRegionsOnEmpty={true}
              />
            </div>
            
            <Separator />
            
            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="photo"
                  checked={onlyWithPhoto}
                  onCheckedChange={(checked) => setOnlyWithPhoto(checked as boolean)}
                />
                <Label htmlFor="photo" className="cursor-pointer">
                  Тільки з фото
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="promoted"
                  checked={onlyPromoted}
                  onCheckedChange={(checked) => setOnlyPromoted(checked as boolean)}
                />
                <Label htmlFor="promoted" className="cursor-pointer">
                  Тільки промо
                </Label>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <Button
              onClick={handleApply}
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:shadow-glow transition-all duration-300"
            >
              Застосувати фільтри
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full group"
            >
              <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Скинути все
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};