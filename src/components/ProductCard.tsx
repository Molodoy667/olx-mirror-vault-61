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
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button 
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
        {isPromoted && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-xs font-semibold px-2 py-1 rounded">
            ТОП
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 min-h-[48px]">
          {title}
        </h3>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl font-bold text-primary">{price}</span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground space-x-2">
          <MapPin className="w-3 h-3" />
          <span>{location}</span>
          <span>•</span>
          <span>{date}</span>
        </div>
      </div>
    </Card>
  );
}