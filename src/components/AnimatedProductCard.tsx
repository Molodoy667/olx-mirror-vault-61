import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, Heart, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BusinessProfileBadge } from "@/components/BusinessProfileBadge";
import { OptimizedImage } from "@/components/OptimizedImage";
import { getOrCreateSeoUrl } from "@/lib/seo";

interface AnimatedProductCardProps {
  id: string;
  title: string;
  price: number;
  currency?: string;
  location: string;
  image: string;
  isPromoted?: boolean;
  createdAt?: string;
  views?: number;
  rating?: number;
  category?: string;
  userId?: string;
}

export const AnimatedProductCard = ({
  id,
  title,
  price,
  currency = 'UAH',
  location,
  image,
  isPromoted = false,
  createdAt,
  views = 0,
  rating = 0,
  category,
  userId,
}: AnimatedProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sellerData, setSellerData] = useState<{
    isBusiness: boolean;
    isVerified: boolean;
    averageRating: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      checkFavorite();
    }
    if (userId) {
      fetchSellerData();
    }
  }, [user, id, userId]);

  const fetchSellerData = async () => {
    if (!userId) return;

    try {
      // Check if user has business profile
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('verification_status')
        .eq('user_id', userId)
        .single();

      // Get user ratings
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', userId);

      const isBusiness = !!businessProfile;
      const isVerified = businessProfile?.verification_status === 'verified';
      const averageRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      setSellerData({ isBusiness, isVerified, averageRating });
    } catch (error) {
      console.error('Error fetching seller data:', error);
    }
  };

  const checkFavorite = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user?.id)
        .eq('listing_id', id)
        .single();

      if (data && !error) {
        setIsFavorite(true);
      }
    } catch (error) {
      // Not in favorites
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Потрібен вхід",
        description: "Увійдіть, щоб додати в обране",
        variant: "destructive",
      });
      navigate('/auth');
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
          .insert([{
            user_id: user.id,
            listing_id: id
          }]);
        
        setIsFavorite(true);
        toast({
          title: "Додано в обране",
          description: "Оголошення додано до вашого списку обраних",
        });
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити обране",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = async () => {
    if (isLoading) return;
    
    try {
      const seoUrl = await getOrCreateSeoUrl(id, title);
      navigate(seoUrl);
    } catch (error) {
      console.error('Error navigating to listing:', error);
      navigate(`/listing/${id}`);
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "transition-all duration-300 ease-out",
        "hover:shadow-elevated hover:-translate-y-1",
        "animate-fade-in"
      )}
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className={cn(
            "w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-110"
          )}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(false)}
        />
        
        {/* Loading placeholder with glass effect */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 animate-pulse">
            <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted-foreground/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        )}
        
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isPromoted && (
            <Badge className="bg-yellow-500 text-white animate-scale-in shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              Промо
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              {category}
            </Badge>
          )}
        </div>
        
        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          disabled={isLoading}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full",
            "bg-background/90 backdrop-blur-sm",
            "transition-all duration-300",
            "hover:scale-110 hover:bg-background",
            "shadow-md hover:shadow-lg",
            isFavorite && "text-red-500"
          )}
        >
          <Heart 
            className={cn(
              "w-5 h-5 transition-all duration-300",
              isFavorite && "fill-current"
            )}
          />
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-primary">
              {price > 0 ? `${price.toLocaleString('uk-UA')} ${currency}` : 'Безкоштовно'}
            </p>
            {price > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {(price * 1.2).toLocaleString('uk-UA')} {currency}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="truncate max-w-[150px]">{location}</span>
          </div>
          
          {views > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{views}</span>
            </div>
          )}
        </div>
        
        {createdAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: uk })}
            </span>
          </div>
        )}
        
        {sellerData && (
          <div className="absolute top-2 left-2 z-10">
            <BusinessProfileBadge
              isBusiness={sellerData.isBusiness}
              isVerified={sellerData.isVerified}
              rating={sellerData.averageRating > 0 ? sellerData.averageRating : undefined}
              size="sm"
            />
          </div>
        )}
        
        {rating > 0 && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-4 h-4 transition-colors duration-200",
                  i < rating 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};