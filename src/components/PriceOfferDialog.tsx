import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DollarSign, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PriceOfferDialogProps {
  listingId: string;
  currentPrice: number;
  sellerId: string;
  listingTitle: string;
  currency?: string;
}

export function PriceOfferDialog({ 
  listingId, 
  currentPrice, 
  sellerId, 
  listingTitle,
  currency = "UAH" 
}: PriceOfferDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Авторизуйтесь",
        description: "Щоб зробити пропозицію ціни, потрібно увійти в акаунт",
        variant: "destructive",
      });
      return;
    }

    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast({
        title: "Помилка",
        description: "Введіть коректну ціну",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Відправляємо повідомлення з пропозицією
      const offerMessage = `💰 Пропозиція ціни: ${offerPrice} ${currency}

Оголошення: ${listingTitle}
Ваша ціна: ${currentPrice} ${currency}
Моя пропозиція: ${offerPrice} ${currency}

${message ? `Коментар: ${message}` : ""}`;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: sellerId,
          content: offerMessage,
          listing_id: listingId
        });

      if (error) throw error;

      toast({
        title: "Пропозицію відправлено!",
        description: "Продавець отримає ваше повідомлення з пропозицією ціни",
      });

      setIsOpen(false);
      setOfferPrice("");
      setMessage("");
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося відправити пропозицію",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Розрахуємо рекомендовані ціни
  const recommendedPrices = [
    Math.round(currentPrice * 0.8),
    Math.round(currentPrice * 0.85),
    Math.round(currentPrice * 0.9),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1">
          <DollarSign className="w-4 h-4 mr-2" />
          Запропонувати ціну
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Запропонувати свою ціну</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmitOffer} className="space-y-4">
          <div>
            <Label>Поточна ціна: {currentPrice.toLocaleString()} {currency}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-price">Ваша пропозиція</Label>
            <div className="relative">
              <Input
                id="offer-price"
                type="number"
                placeholder="Введіть ціну"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                min="1"
                max={currentPrice}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Рекомендовані ціни:
            </Label>
            <div className="flex gap-2">
              {recommendedPrices.map((price) => (
                <Button
                  key={price}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOfferPrice(price.toString())}
                  className="text-xs"
                >
                  {price.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="offer-message">Повідомлення (необов'язково)</Label>
            <Textarea
              id="offer-message"
              placeholder="Додайте коментар до вашої пропозиції..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={loading || !offerPrice}
              className="flex-1"
            >
              {loading ? (
                "Відправляємо..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Відправити
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}