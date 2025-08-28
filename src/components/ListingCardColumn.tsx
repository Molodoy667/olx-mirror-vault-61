import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, Heart, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { getOrCreateSeoUrl } from "@/lib/seo";
import { uk } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/OptimizedImage";

interface ListingCardColumnProps {
  id: string;
  title: string;
  price: number;
  currency?: string;
  location: string;
  image: string;
  isPromoted?: boolean;
  createdAt?: string;
  views?: number;
  description?: string;
}

export const ListingCardColumn = ({
  id,
  title,
  price,
  currency = 'UAH',
  location,
  image,
  isPromoted = false,
  createdAt,
  views = 0,
  description,
}: ListingCardColumnProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
  }, [user, id]);

  const checkFavorite = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', id)
        .single();
      
      setIsFavorite(!!data);
    } catch (error) {
      // Not a favorite if error occurs
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Увійдіть в систему",
        description: "Для збереження в обране потрібно увійти в систему",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);
        setIsFavorite(false);
        toast({
          title: "Видалено з обраного",
          description: "Оголошення видалено з вашого списку обраних",
        });
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            listing_id: id,
          });
        setIsFavorite(true);
        toast({
          title: "Додано в обране",
          description: "Оголошення додано до вашого списку обраних",
        });
      }
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося обновити список обраних",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Безкоштовно';
    return new Intl.NumberFormat('uk-UA').format(price) + ' ' + currency;
  };

  const timeAgo = createdAt ? formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true, 
    locale: uk 
  }) : '';

  return (
    <Card 
      className={cn(
        "group cursor-pointer border border-border bg-card hover:bg-accent/30",
        "transition-all duration-300 hover:shadow-lg hover:shadow-primary/10",
        "flex flex-col w-full max-w-sm mx-auto",
        "animate-fade-in"
      )}
      onClick={async () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Навігація прямо по ID оголошення (новий формат)
        navigate(`/${id}`);
      }}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(false)}
        />
        
        {/* Glass loading effect */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 animate-pulse">
            <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted-foreground/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isPromoted && (
            <Badge className="bg-yellow-500 text-white animate-scale-in shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              VIP
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full",
            "bg-white/90 backdrop-blur-sm border border-white/20",
            "hover:bg-white hover:scale-110",
            "transition-all duration-200 shadow-lg",
            "disabled:opacity-50"
          )}
        >
          <Heart 
            className={cn(
              "w-4 h-4 transition-colors duration-200",
              isFavorite 
                ? "fill-red-500 text-red-500" 
                : "text-gray-600 hover:text-red-500"
            )} 
          />
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Price */}
        <div className="text-xl font-bold text-primary mb-3">
          {formatPrice(price)}
        </div>

        {/* Location and Views */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="truncate">{location}</span>
          </div>
          {views > 0 && (
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              <span>{views}</span>
            </div>
          )}
        </div>

        {/* Time */}
        {timeAgo && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            <span>{timeAgo}</span>
          </div>
        )}
      </div>
    </Card>
  );
};