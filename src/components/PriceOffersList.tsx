import { usePriceOffers, useUpdatePriceOfferStatus } from '@/hooks/usePriceOffers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, User, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface PriceOffersListProps {
  listingId?: string;
}

export function PriceOffersList({ listingId }: PriceOffersListProps) {
  const { data: offers, isLoading } = usePriceOffers(listingId);
  const { user } = useAuth();
  const updateStatus = useUpdatePriceOfferStatus();

  const handleUpdateStatus = async (offerId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateStatus.mutateAsync({ offerId, status });
      toast({
        title: status === 'accepted' ? 'Пропозицію прийнято' : 'Пропозицію відхилено',
        description: 'Покупець отримає сповіщення про ваше рішення',
      });
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити статус пропозиції',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          {listingId ? 'Немає пропозицій по ціні' : 'Немає активних пропозицій'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => {
        const isSeller = user?.id === offer.seller_id;
        const canRespond = isSeller && offer.status === 'pending';

        return (
          <Card key={offer.id} className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">
                      Користувач {offer.buyer_id.slice(0, 8)}
                    </h4>
                    <Badge 
                      variant={
                        offer.status === 'accepted' ? 'default' :
                        offer.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {offer.status === 'accepted' ? 'Прийнято' :
                       offer.status === 'rejected' ? 'Відхилено' :
                       'Очікує відповіді'}
                    </Badge>
                  </div>
                  
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(offer.created_at), {
                      addSuffix: true,
                      locale: uk,
                    })}
                  </span>
                </div>

                <div className="mb-2">
                  <p className="text-sm font-medium">Оголошення #{offer.listing_id.slice(0, 8)}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">
                      Пропозиція: {offer.offered_price.toLocaleString()} UAH
                    </span>
                  </div>
                </div>

                {offer.message && (
                  <p className="text-sm text-muted-foreground mb-3">
                    "{offer.message}"
                  </p>
                )}

                {canRespond && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(offer.id, 'accepted')}
                      disabled={updateStatus.isPending}
                      className="bg-success hover:bg-success/90"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Прийняти
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUpdateStatus(offer.id, 'rejected')}
                      disabled={updateStatus.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Відхилити
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}