import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { UserRating } from '@/hooks/useUserRatings';

interface UserRatingCardProps {
  rating: UserRating;
}

export function UserRatingCard({ rating }: UserRatingCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={rating.rater_profile?.avatar_url} 
            alt={rating.rater_profile?.full_name} 
          />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">
                {rating.rater_profile?.full_name || 'Користувач'}
              </h4>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rating.rating 
                        ? 'text-warning fill-current' 
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(rating.created_at), {
                addSuffix: true,
                locale: uk,
              })}
            </span>
          </div>
          
          {rating.comment && (
            <p className="text-sm text-muted-foreground">
              {rating.comment}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}