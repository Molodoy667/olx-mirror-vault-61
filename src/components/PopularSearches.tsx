import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePopularSearches } from "@/hooks/usePopularSearches";
import { supabase } from "@/integrations/supabase/client";

export function PopularSearches() {
  const navigate = useNavigate();
  const { data: popularSearches, isLoading } = usePopularSearches('search', 8);

  const handleSearchClick = async (term: string) => {
    // Отслеживаем клик по популярному запросу
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
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Популярні пошуки</h2>
              <p className="text-muted-foreground text-sm">
                Що шукають зараз
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="px-5 py-2.5 rounded-full bg-muted animate-pulse">
                <div className="h-4 bg-muted-foreground/20 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Популярні пошуки</h2>
            <p className="text-muted-foreground text-sm">
              Що шукають зараз
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {popularSearches?.map((search, index) => (
            <button
              key={search.term}
              onClick={() => handleSearchClick(search.term)}
              className={cn(
                "group relative px-4 py-3 rounded-lg",
                "bg-gradient-to-br border border-border/50",
                "hover:shadow-md hover:scale-105",
                "transition-all duration-300",
                "animate-fade-in text-left",
                index % 3 === 0 && "from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20",
                index % 3 === 1 && "from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20",
                index % 3 === 2 && "from-green-500/10 to-teal-500/10 hover:from-green-500/20 hover:to-teal-500/20"
              )}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium text-sm truncate flex-1">{search.term}</span>
                {search.trending && (
                  <Badge variant="secondary" className="px-1 py-0.5 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 scale-75">
                    HOT
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {search.count.toLocaleString('uk-UA')} запитів
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}