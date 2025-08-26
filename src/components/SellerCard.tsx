import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Star, 
  Calendar, 
  Package, 
  MessageCircle,
  Shield,
  CheckCircle 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BusinessProfileBadge } from '@/components/BusinessProfileBadge';

interface SellerCardProps {
  userId: string;
  onContact: () => void;
}

export function SellerCard({ userId, onContact }: SellerCardProps) {
  const navigate = useNavigate();
  const [sellerData, setSellerData] = useState<any>(null);
  const [listingsCount, setListingsCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [isBusiness, setIsBusiness] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);

  useEffect(() => {
    fetchSellerData();
  }, [userId]);

  const fetchSellerData = async () => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setSellerData(profile);
      // Use account_type and is_verified from profile
      setIsBusiness(profile?.account_type === 'business');
      setIsVerified(profile?.is_verified || false);

      // Fetch listings count
      const { count } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      setListingsCount(count || 0);

      // Fetch ratings data
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', userId);

      if (!ratingsError && ratingsData.length > 0) {
        const avgRating = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
        setRating(Number(avgRating.toFixed(1)));
        setReviewsCount(ratingsData.length);
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'К';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const memberSince = sellerData?.created_at 
    ? formatDistanceToNow(new Date(sellerData.created_at), { 
        addSuffix: false, 
        locale: uk 
      })
    : 'Нещодавно';

  return (
    <Card className="p-6 space-y-6">
      {/* Seller Header */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Продавець
        </h3>
        
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage src={sellerData?.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-semibold">
              {getInitials(sellerData?.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-lg">
                {sellerData?.full_name || 'Користувач'}
              </h4>
            </div>
            
            <BusinessProfileBadge 
              isBusiness={isBusiness}
              isVerified={isVerified}
              rating={rating}
              size="md"
            />
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <span>{reviewsCount} відгуків</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">На Novado</span>
          </div>
          <p className="font-medium">{memberSince}</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="w-4 h-4" />
            <span className="text-sm">Оголошень</span>
          </div>
          <p className="font-medium">{listingsCount}</p>
        </div>
      </div>

      {/* Response Time */}
      <div className="p-3 rounded-lg bg-accent/50">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium">Зазвичай відповідає протягом години</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button 
          onClick={onContact}
          className="w-full" 
          size="lg"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Написати продавцю
        </Button>
        
        <Button 
          onClick={() => navigate(`/profile/${userId}`)}
          variant="outline" 
          className="w-full"
        >
          <User className="w-4 h-4 mr-2" />
          Всі оголошення автора
        </Button>
      </div>
    </Card>
  );
}