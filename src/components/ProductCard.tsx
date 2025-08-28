import { Heart, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getOrCreateSeoUrl } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  location: string;
  date: string;
  image: string;
  isPromoted?: boolean;
}

export function ProductCard({ 
  id, 
  title, 
  price, 
  location, 
  date, 
  image, 
  isPromoted = false 
}: ProductCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user && id) {
      checkFavorite();
    }
  }, [user, id]);

  const checkFavorite = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user?.id)
      .eq('listing_id', id)
      .single();
    
    setIsFavorite(!!data);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Потрібна авторизація",
        description: "Увійдіть, щоб додати до обраного",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);
        
        setIsFavorite(false);
        toast({ title: "Видалено з обраного" });
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: id });
        
        setIsFavorite(true);
        toast({ title: "Додано до обраного" });
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити обране",
        variant: "destructive",
      });
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={async () => {
        try {
          const seoUrl = await getOrCreateSeoUrl(id, title);
          navigate(seoUrl);
        } catch (error) {
          console.error('Error navigating to listing:', error);
          navigate(`/listing/${id}`);
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Glass overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        
        {/* Top elements */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          {isPromoted && (
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold text-xs px-2 py-1 rounded shadow-lg">
              ТОП
            </span>
          )}
          
          <button 
            onClick={handleToggleFavorite}
            className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-200 border border-white/20 w-8 h-8 rounded-full flex items-center justify-center"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Price under like button (glass frame) */}
        <div className="absolute top-12 right-2">
          <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 border border-white/20 shadow-lg">
            <p className="text-sm font-bold text-white drop-shadow-md text-right">
              {price}
            </p>
          </div>
        </div>

        {/* Title at bottom (glass frame with scrolling) */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="bg-white/20 backdrop-blur-md border-t border-white/20 p-3">
            <div className="overflow-hidden">
              <h3 
                className={`text-white font-semibold text-lg drop-shadow-md transition-transform duration-300 ease-linear ${
                  title.length > 40 ? 'animate-scroll-text' : ''
                }`}
                style={{
                  animationDuration: title.length > 40 ? `${title.length * 0.15}s` : undefined
                }}
              >
                {title}
              </h3>
            </div>
            
            {/* Location and date */}
            <div className="flex items-center justify-between mt-2 text-sm text-white/90">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{location}</span>
              </div>
              <span className="text-xs">{date}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}