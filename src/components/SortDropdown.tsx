import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const SortDropdown = ({ value, onChange }: SortDropdownProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] hover:bg-accent transition-colors duration-200">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-primary" />
          <SelectValue placeholder="Сортування" />
        </div>
      </SelectTrigger>
      <SelectContent className="z-[60] bg-popover backdrop-blur-md border shadow-elevated">
        <SelectItem value="newest" className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Найновіші</span>
          </div>
        </SelectItem>
        <SelectItem value="oldest" className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 rotate-180" />
            <span>Найстаріші</span>
          </div>
        </SelectItem>
        <SelectItem value="price-asc" className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            <span>Ціна: за зростанням</span>
          </div>
        </SelectItem>
        <SelectItem value="price-desc" className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Ціна: за спаданням</span>
          </div>
        </SelectItem>
        <SelectItem value="popular" className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Популярні</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};