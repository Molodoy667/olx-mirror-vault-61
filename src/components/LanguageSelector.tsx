import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  return (
    <Select defaultValue="uk">
      <SelectTrigger className="w-16 h-8 border-0 bg-transparent hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-1">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="min-w-[100px] z-[60] bg-popover backdrop-blur-md border shadow-elevated">
        <SelectItem value="uk" className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇺🇦</span>
            <span>Укр</span>
          </div>
        </SelectItem>
        <SelectItem value="ru" className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇷🇺</span>
            <span>Рус</span>
          </div>
        </SelectItem>
        <SelectItem value="en" className="hover:bg-accent">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇺🇸</span>
            <span>Eng</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}