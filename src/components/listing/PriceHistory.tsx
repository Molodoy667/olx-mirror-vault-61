import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface PriceHistoryProps {
  listingId: string;
  currentPrice: number | null;
  currency: string;
}

export function PriceHistory({ listingId, currentPrice, currency }: PriceHistoryProps) {
  const { data: priceHistory } = useQuery({
    queryKey: ['price-history', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('listing_id', listingId)
        .order('changed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (!priceHistory || priceHistory.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3 text-sm">Історія зміни ціни</h4>
      <div className="space-y-2">
        {currentPrice && (
          <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
            <span className="text-sm font-medium">Поточна ціна</span>
            <span className="font-semibold text-primary">
              {currentPrice.toLocaleString('uk-UA')} {currency}
            </span>
          </div>
        )}
        
        {priceHistory.map((record, index) => {
          const priceChange = record.new_price && record.old_price 
            ? record.new_price - record.old_price 
            : 0;
          const percentChange = record.old_price 
            ? (priceChange / record.old_price) * 100 
            : 0;
          
          return (
            <div key={record.id} className="flex items-center justify-between py-2 border-t">
              <div className="flex items-center gap-2">
                {priceChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-destructive" />
                ) : priceChange < 0 ? (
                  <TrendingDown className="w-4 h-4 text-success" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <div className="text-sm">
                    {record.old_price?.toLocaleString('uk-UA')} → {record.new_price?.toLocaleString('uk-UA')} {currency}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(record.changed_at), 'd MMM yyyy', { locale: uk })}
                  </div>
                </div>
              </div>
              {percentChange !== 0 && (
                <span className={`text-xs font-medium ${
                  priceChange > 0 ? 'text-destructive' : 'text-success'
                }`}>
                  {priceChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}