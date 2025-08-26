import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HandHeart, DollarSign } from 'lucide-react';
import { useCreatePriceOffer } from '@/hooks/usePriceOffers';
import { toast } from '@/hooks/use-toast';

interface CreatePriceOfferDialogProps {
  listingId: string;
  sellerId: string;
  currentPrice?: number;
  currency: string;
  listingTitle: string;
}

export function CreatePriceOfferDialog({
  listingId,
  sellerId,
  currentPrice,
  currency,
  listingTitle,
}: CreatePriceOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [offeredPrice, setOfferedPrice] = useState(currentPrice ? Math.floor(currentPrice * 0.8) : 0);
  const [message, setMessage] = useState('');
  
  const createOffer = useCreatePriceOffer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!offeredPrice || offeredPrice <= 0) {
      toast({
        title: 'Помилка',
        description: 'Введіть коректну ціну',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createOffer.mutateAsync({
        listingId,
        sellerId,
        offeredPrice,
        message: message || undefined,
      });

      toast({
        title: 'Пропозицію надіслано',
        description: 'Продавець отримає ваше повідомлення і зможе прийняти або відхилити пропозицію',
      });

      setOpen(false);
      setOfferedPrice(currentPrice ? Math.floor(currentPrice * 0.8) : 0);
      setMessage('');
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося надіслати пропозицію',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-glow hover:shadow-elevated transition-all duration-300" 
          size="lg"
        >
          <DollarSign className="w-5 h-5 mr-2" />
          Запропонувати ціну
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Запропонувати ціну</DialogTitle>
          <DialogDescription>
            Надішліть свою пропозицію продавцю
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="font-medium text-sm">{listingTitle}</p>
            {currentPrice && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">Поточна ціна:</span>
                <Badge variant="secondary">
                  {currentPrice.toLocaleString()} {currency}
                </Badge>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="price">Ваша пропозиція</Label>
              <div className="flex gap-2">
                <Input
                  id="price"
                  type="number"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(Number(e.target.value))}
                  placeholder="0"
                  min="1"
                  required
                />
                <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground">
                  {currency}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="message">Повідомлення (необов'язково)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Додайте коментар до вашої пропозиції..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                disabled={createOffer.isPending}
                className="flex-1"
              >
                {createOffer.isPending ? 'Відправка...' : 'Надіслати'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}