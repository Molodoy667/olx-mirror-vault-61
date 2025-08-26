import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Star, Zap, Crown, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TariffPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  duration_days: number;
  description: string;
}

interface VIPPromotionDialogProps {
  listingId: string;
  listingTitle: string;
  trigger?: React.ReactNode;
}

export function VIPPromotionDialog({ listingId, listingTitle, trigger }: VIPPromotionDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<TariffPlan | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch VIP and promo tariff plans
  const { data: tariffs } = useQuery({
    queryKey: ['promotion-tariffs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select('*')
        .in('type', ['vip_listing', 'promo_listing'])
        .eq('is_active', true)
        .order('type')
        .order('price');

      if (error) throw error;
      return data as TariffPlan[];
    },
  });

  // Create promotion subscription
  const createPromotion = useMutation({
    mutationFn: async (tariff: TariffPlan) => {
      if (!user) throw new Error('User not authenticated');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + tariff.duration_days);

      // Create subscription record
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          tariff_plan_id: tariff.id,
          listing_id: listingId,
          expires_at: expiresAt.toISOString(),
          payment_amount: tariff.price,
          payment_currency: tariff.currency,
        });

      if (subscriptionError) throw subscriptionError;

      // Update listing with promotion
      const promotionType = tariff.type === 'vip_listing' ? 'vip' : 'promoted';
      const updateData: any = {
        promotion_type: promotionType,
        promoted_at: new Date().toISOString(),
      };

      if (tariff.type === 'vip_listing') {
        updateData.is_vip = true;
        updateData.vip_until = expiresAt.toISOString();
      } else {
        updateData.is_promoted = true;
        updateData.promoted_until = expiresAt.toISOString();
      }

      const { error: listingError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      if (listingError) throw listingError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] });
      toast({
        title: 'Оголошення просунуто',
        description: `Ваше оголошення "${listingTitle}" успішно просунуто`,
      });
      setOpen(false);
      setSelectedTariff(null);
    },
    onError: () => {
      toast({
        title: 'Помилка',
        description: 'Не вдалося просунути оголошення',
        variant: 'destructive',
      });
    },
  });

  const handlePromotion = () => {
    if (!selectedTariff) return;
    createPromotion.mutate(selectedTariff);
  };

  const getPromotionIcon = (type: string) => {
    return type === 'vip_listing' ? <Crown className="w-5 h-5" /> : <Zap className="w-5 h-5" />;
  };

  const getPromotionColor = (type: string) => {
    return type === 'vip_listing' ? 'from-purple-500 to-purple-600' : 'from-amber-500 to-amber-600';
  };

  const vipTariffs = tariffs?.filter(t => t.type === 'vip_listing') || [];
  const promoTariffs = tariffs?.filter(t => t.type === 'promo_listing') || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
            <Star className="w-4 h-4 mr-2" />
            Просунути оголошення
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            Просування оголошення
          </DialogTitle>
          <DialogDescription>
            Виберіть тип просування для "{listingTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* VIP Listings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">VIP Оголошення</h3>
              <Badge className="bg-purple-100 text-purple-800">Топ позиції</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ваше оголошення з'являтиметься в топі результатів пошуку
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {vipTariffs.map((tariff) => (
                <Card 
                  key={tariff.id} 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTariff?.id === tariff.id 
                      ? 'ring-2 ring-purple-500 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTariff(tariff)}
                >
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center">
                      <Crown className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold">{tariff.name}</h4>
                    <div className="text-2xl font-bold text-purple-600">
                      {tariff.price} ₴
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tariff.duration_days} днів у топі
                    </p>
                    <p className="text-xs">{tariff.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Promo Listings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold">Промо Оголошення</h3>
              <Badge className="bg-amber-100 text-amber-800">Виділення кольором</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ваше оголошення буде виділено кольором серед інших
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {promoTariffs.map((tariff) => (
                <Card 
                  key={tariff.id} 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedTariff?.id === tariff.id 
                      ? 'ring-2 ring-amber-500 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTariff(tariff)}
                >
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center">
                      <Zap className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="font-semibold">{tariff.name}</h4>
                    <div className="text-2xl font-bold text-amber-600">
                      {tariff.price} ₴
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tariff.duration_days} днів виділення
                    </p>
                    <p className="text-xs">{tariff.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {selectedTariff && (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Обрано: {selectedTariff.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedTariff.price} {selectedTariff.currency} за {selectedTariff.duration_days} днів
                  </p>
                </div>
                <Button
                  onClick={handlePromotion}
                  disabled={createPromotion.isPending}
                  className={`bg-gradient-to-r ${getPromotionColor(selectedTariff.type)} hover:shadow-glow`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {createPromotion.isPending ? 'Обробка...' : 'Оплатити та активувати'}
                </Button>
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Скасувати
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}