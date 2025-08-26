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

  const handleCardClick = (e: React.MouseEvent) => {
    // Если клик по кнопке лайка, не переходим на страницу
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/listing/${id}`);
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
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Новий</Badge>;
      case 'refurbished':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Відновлений</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="relative">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
          {isPromoted && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold">
              VIP
            </Badge>
          )}
        </div>

        {/* Like Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 bg-white/80 hover:bg-white transition-colors",
            isLiked && "text-red-500"
          )}
          onClick={handleLikeClick}
          disabled={likeLoading}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
        </Button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 mb-2">
          <p className="text-2xl font-bold text-primary">
            {price > 0 ? `${price.toLocaleString('uk-UA')} ${currency}` : 'Безкоштовно'}
          </p>
          {negotiable && price > 0 && (
            <Badge variant="outline" className="text-xs">
              Торг
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          {getConditionBadge(condition)}
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{location}</span>
          </div>
          {views > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{views}</span>
            </div>
          )}
        </div>

        {createdAt && (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: uk })}
          </div>
        )}
      </div>
    </Card>
  );
};