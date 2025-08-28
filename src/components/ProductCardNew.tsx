import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useListingLikes } from "@/hooks/useListingLikes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getOrCreateSeoUrl } from "@/lib/seo";

interface ProductCardNewProps {
  id: string;
  title: string;
  price: number;
  currency?: string;
  location: string;
  image: string;
  isPromoted?: boolean;
  createdAt?: string;
  views?: number;
  userId?: string;
  condition?: 'new' | 'used' | 'refurbished';
  negotiable?: boolean;
}

export const ProductCardNew = ({
  id,
  title,
  price,
  currency = 'UAH',
  location,
  image,
  isPromoted = false,
  createdAt,
  views = 0,
  userId,
  condition,
  negotiable = true,
}: ProductCardNewProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLiked, toggleLike, isLoading: likeLoading } = useListingLikes(id);

  const handleCardClick = async (e: React.MouseEvent) => {
    // Если клик по кнопке лайка, не переходим на страницу
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Навігація прямо по ID оголошення (новий формат)
    navigate(`/${id}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    toggleLike();
  };

  const getConditionBadge = (condition?: string) => {
    switch (condition) {
      case 'new':
        return (
          <Badge className="bg-green-500/20 backdrop-blur-md text-green-100 border border-green-400/30 shadow-lg">
            Новий
          </Badge>
        );
      case 'refurbished':
        return (
          <Badge className="bg-blue-500/20 backdrop-blur-md text-blue-100 border border-blue-400/30 shadow-lg">
            Відновлений
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {/* Background Image */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Glass overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
        
        {/* Top Row: VIP Badge, Condition Badge, Like Button */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <div className="flex gap-2">
            {isPromoted && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold shadow-lg">
                VIP
              </Badge>
            )}
            {getConditionBadge(condition)}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-200 border border-white/20",
              isLiked && "text-red-500"
            )}
            onClick={handleLikeClick}
            disabled={likeLoading}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          </Button>
        </div>

        {/* Price under like button (glass frame) */}
        <div className="absolute top-12 right-2">
          <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-1 border border-white/20 shadow-lg">
            <p className="text-sm font-bold text-white drop-shadow-md text-right">
              {price > 0 ? `${price.toLocaleString('uk-UA')} ${currency}` : 'Безкоштовно'}
            </p>
            {negotiable && price > 0 && (
              <p className="text-xs text-white/80 text-right">Торг</p>
            )}
          </div>
        </div>

        {/* Title at bottom (glass frame with scrolling) */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="bg-white/20 backdrop-blur-md border-t border-white/20 p-3">
            <div className="overflow-hidden">
              <h3 
                className={cn(
                  "text-white font-semibold text-lg drop-shadow-md transition-transform duration-300 ease-linear",
                  title.length > 40 && "animate-scroll-text"
                )}
                style={{
                  animationDuration: title.length > 40 ? `${title.length * 0.15}s` : undefined
                }}
              >
                {title}
              </h3>
            </div>
            
            {/* Location and Views */}
            <div className="flex items-center justify-between mt-2 text-sm text-white/90">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{location}</span>
              </div>
              <div className="flex items-center gap-3">
                {views > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{views}</span>
                  </div>
                )}
                {createdAt && (
                  <span className="text-xs">
                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: uk })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};