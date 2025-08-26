import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Tag, 
  MapPin, 
  Clock, 
  Eye, 
  Heart,
  Share2,
  MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ListingHeaderProps {
  listing: any;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onContact: () => void;
  onShare: () => void;
}

export function ListingHeader({ 
  listing, 
  isFavorite, 
  onToggleFavorite, 
  onContact,
  onShare 
}: ListingHeaderProps) {
  return (
    <Card className="p-6 space-y-4">
      {listing.is_promoted && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-warning/20 to-warning/10 text-warning text-sm font-medium">
          <Zap className="w-4 h-4" />
          Промо оголошення
        </div>
      )}
      
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <div className="flex flex-wrap gap-2">
            {listing.categories && (
              <Badge variant="secondary" className="gap-1">
                <Tag className="w-3 h-3" />
                {listing.categories.name_uk}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-right">
          {listing.price ? (
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                {listing.price.toLocaleString('uk-UA')} {listing.currency}
              </div>
            </div>
          ) : (
            <div className="text-2xl font-semibold text-muted-foreground">
              Безкоштовно
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span>{listing.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{formatDistanceToNow(new Date(listing.created_at), { 
            addSuffix: true, 
            locale: uk 
          })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span>{listing.views} переглядів</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <Button 
          onClick={onContact}
          size="lg"
          className="flex-1 min-w-[200px] bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-all duration-300"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Написати повідомлення
        </Button>
        
        <Button
          onClick={onToggleFavorite}
          variant={isFavorite ? "default" : "outline"}
          size="lg"
          className={`px-6 transition-all duration-300 ${
            isFavorite 
              ? "bg-red-500 hover:bg-red-600 text-white shadow-glow" 
              : "hover:border-red-500 hover:text-red-500 hover:shadow-sm"
          }`}
        >
          <Heart className={`w-5 h-5 transition-transform ${isFavorite ? 'fill-current scale-110' : ''}`} />
          <span className="sr-only ml-2 hidden sm:inline">
            {isFavorite ? "Видалити з обраного" : "Додати до обраного"}
          </span>
        </Button>
        
        <Button
          onClick={onShare}
          variant="outline"
          size="lg"
          className="px-6 hover:border-blue-500 hover:text-blue-500 hover:shadow-sm transition-all duration-300"
        >
          <Share2 className="w-5 h-5" />
          <span className="sr-only ml-2 hidden sm:inline">Поділитися</span>
        </Button>
      </div>
    </Card>
  );
}