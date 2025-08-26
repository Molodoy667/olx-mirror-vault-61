import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Flag } from 'lucide-react';

interface ReportDialogProps {
  listingId: string;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Спам або реклама' },
  { value: 'fraud', label: 'Шахрайство' },
  { value: 'inappropriate', label: 'Неприйнятний вміст' },
  { value: 'wrong_category', label: 'Неправильна категорія' },
  { value: 'sold', label: 'Товар вже продано' },
  { value: 'other', label: 'Інша причина' },
];

export function ReportDialog({ listingId }: ReportDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Потрібна авторизація');
      
      const { error } = await supabase
        .from('reports')
        .insert({
          listing_id: listingId,
          user_id: user.id,
          reason,
          description: description.trim() || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setReason('');
      setDescription('');
      toast({
        title: "Скаргу надіслано",
        description: "Дякуємо! Ми розглянемо вашу скаргу найближчим часом.",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося надіслати скаргу",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!user) {
      toast({
        title: "Потрібна авторизація",
        description: "Увійдіть, щоб поскаржитися на оголошення",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Оберіть причину",
        description: "Будь ласка, вкажіть причину скарги",
        variant: "destructive",
      });
      return;
    }

    submitReport.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Flag className="w-4 h-4 mr-2" />
          Поскаржитися
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Поскаржитися на оголошення</DialogTitle>
          <DialogDescription>
            Якщо це оголошення порушує правила сайту, повідомте нам про це.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Причина скарги</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Додаткова інформація (необов'язково)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишіть проблему детальніше..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Скасувати
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason || submitReport.isPending}
          >
            Надіслати скаргу
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}