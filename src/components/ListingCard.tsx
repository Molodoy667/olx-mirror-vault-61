import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Clock, Eye, Phone, MessageCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useListingLikes } from "@/hooks/useListingLikes";
import { useListingStats } from "@/hooks/useListingStats";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { generateListingUrl } from "@/lib/seo";

interface ListingCardProps {
  id: string;
  title: string;
  price: number | null;
  currency?: string;
  location: string;
  image: string;
  isPromoted?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  condition?: 'new' | 'used' | 'refurbished';
  negotiable?: boolean;
  userId: string;
  contactPhone?: string;
  views?: number;
  className?: string;
}

export const ListingCard = ({
  id,
  title,
  price,
  currency = 'UAH',
  location,
  image,
  isPromoted = false,
  isFeatured = false,
  createdAt,
  condition,
  negotiable = true,
  userId,
  contactPhone,
  views = 0,
  className,
}: ListingCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLiked, likesCount, toggleLike, isLoading: likeLoading } = useListingLikes(id);
  const { recordContact } = useListingStats(id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Если клик по кнопкам, не переходим
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    // Используем SEO-friendly URL
    const seoUrl = generateListingUrl(title, id);
    navigate(seoUrl);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    toggleLike();
  };

  const handleContactClick = (type: 'phone' | 'chat') => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    recordContact(type === 'phone' ? 'view_phone' : 'chat');
    
    if (type === 'chat') {
      navigate(`/messages/${userId}`);
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price || price === 0) return "Безкоштовно";
    const formatted = price.toLocaleString('uk-UA');
    return `${formatted} ${currency}`;
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
      className={cn(
        "group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden",
        isFeatured && "ring-2 ring-yellow-400 ring-opacity-50",
        className
      )}
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
          {isFeatured && (
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <Star className="w-3 h-3 mr-1" />
              ТОП
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
        <div className="mb-2">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 mb-2">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(price, currency)}
            </p>
            {negotiable && price && price > 0 && (
              <Badge variant="outline" className="text-xs">
                Торг
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            {getConditionBadge(condition)}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
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

        {/* Time and Likes */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          {createdAt && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: uk })}
              </span>
            </div>
          )}
          {likesCount > 0 && (
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span>{likesCount}</span>
            </div>
          )}
        </div>

        {/* Contact Buttons */}
        {user?.id !== userId && (
          <div className="flex gap-2">
            {contactPhone && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContactClick('phone');
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                Телефон
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleContactClick('chat');
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Чат
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};