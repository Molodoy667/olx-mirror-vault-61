import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, Eye, Calendar, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ListingCardCompactProps {
  id: string;
  title: string;
  price: number;
  currency?: string;
  location: string;
  image: string;
  isPromoted?: boolean;
  createdAt?: string;
  views?: number;
}

export const ListingCardCompact = ({
  id,
  title,
  price,
  currency = 'UAH',
  location,
  image,
  isPromoted = false,
  createdAt,
  views,
}: ListingCardCompactProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Потрібна авторизація",
        description: "Увійдіть, щоб додати до обраного",
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
      onClick={() => navigate(`/listing/${id}`)}
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <div className="w-full h-full bg-muted overflow-hidden relative">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          </div>
          {isPromoted && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Промо
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg line-clamp-2 pr-2">{title}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                disabled={isLoading}
                className="flex-shrink-0 h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Heart className={`w-4 h-4 transition-colors ${
                  isFavorite 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-muted-foreground hover:text-red-500'
                }`} />
              </Button>
            </div>
            
            <p className="text-2xl font-bold text-primary mb-3">
              {price > 0 ? `${price.toLocaleString('uk-UA')} ${currency}` : 'Безкоштовно'}
            </p>
          </div>

          {/* Footer */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{location}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {createdAt && (
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>
                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: uk })}
                  </span>
                </div>
              )}
              
              {views && (
                <div className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  <span>{views}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};