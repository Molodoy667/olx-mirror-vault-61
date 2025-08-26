import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePopularSearches } from "@/hooks/usePopularSearches";
import { supabase } from "@/integrations/supabase/client";

export const TrendingSearches = () => {
  const navigate = useNavigate();
  const { data: trendingSearches, isLoading } = usePopularSearches('search', 8);

  const handleSearchClick = async (term: string) => {
    // Отслеживаем клик по трендовому запросу
    try {
      await supabase.functions.invoke('track-search', {
        body: { 
          query: term,
          queryType: 'search'
        }
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
    
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Популярні пошукові запити</h2>
        </div>
        
        <Card className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="flex flex-col p-4 rounded-lg bg-muted/50 animate-pulse">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Популярні пошукові запити</h2>
      </div>
      
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trendingSearches?.map((item, index) => (
            <div
              key={item.term}
              className="flex flex-col p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
              onClick={() => handleSearchClick(item.term)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  #{index + 1}
                </span>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
                >
                  {item.trending ? 'HOT' : item.count}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-semibold group-hover:text-primary transition-colors">
                  {item.term}
                </span>
              </div>
              
              <span className="text-xs text-muted-foreground">
                {item.count.toLocaleString()} пошуків
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};