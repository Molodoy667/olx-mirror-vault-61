import { useEffect, useState } from "react";
import { AnimatedProductCard } from "./AnimatedProductCard";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function RecentlyViewed() {
  const [viewedItems, setViewedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get recently viewed items from localStorage
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    // Ограничиваем до 8 элементов для экономии места
    const limitedItems = recentlyViewed.slice(0, 8);
    
    if (limitedItems.length > 0) {
      loadViewedListings(limitedItems);
    } else {
      setLoading(false);
    }
  }, []);

  const loadViewedListings = async (ids: string[]) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .in('id', ids)
        .eq('status', 'active')
        .limit(8);

      if (error) throw error;
      
      // Sort by the order in localStorage (most recent first)
      const sortedData = ids
        .map(id => data?.find(item => item.id === id))
        .filter(Boolean)
        .slice(0, 8);
      
      setViewedItems(sortedData);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || viewedItems.length === 0) return null;

  return (
    <section className="py-8 px-4 bg-gradient-to-b from-accent/5 to-background">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Нещодавно переглянуті</h2>
              <p className="text-muted-foreground text-sm">
                Товари, які ви переглядали
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              localStorage.removeItem('recentlyViewed');
              setViewedItems([]);
            }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Очистити історію
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {viewedItems.map((item) => (
            <AnimatedProductCard
              key={item.id}
              id={item.id}
              title={item.title}
              price={item.price}
              location={item.location}
              image={item.images?.[0] || "/placeholder.svg"}
              isPromoted={item.is_promoted}
              createdAt={item.created_at}
              views={item.views}
            />
          ))}
        </div>
      </div>
    </section>
  );
}