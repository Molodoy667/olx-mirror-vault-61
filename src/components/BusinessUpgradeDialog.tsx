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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Building, Crown, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TariffPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  description: string;
}

interface VerificationRequest {
  id: string;
  status: string;
  business_name: string;
  created_at: string;
}

export function BusinessUpgradeDialog() {
  const [open, setOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<string>('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch business tariff plans
  const { data: businessTariffs } = useQuery({
    queryKey: ['business-tariffs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select('*')
        .eq('type', 'business_account')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      return data as TariffPlan[];
    },
  });

  // Check if user has pending verification request
  const { data: verificationRequest } = useQuery({
    queryKey: ['user-verification-request', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as VerificationRequest | null;
    },
    enabled: !!user,
  });

  // Submit verification request
  const submitVerification = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user) throw new Error('User not authenticated');

      const verificationData = {
        user_id: user.id,
        business_name: formData.get('business_name') as string,
        business_type: formData.get('business_type') as string,
        tax_id: formData.get('tax_id') as string,
        website: formData.get('website') as string,
        description: formData.get('description') as string,
      };

      const { error } = await supabase
        .from('business_verification_requests')
        .insert(verificationData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-verification-request'] });
      toast({
        title: 'Заявку надіслано',
        description: 'Ваша заявка на верифікацію бізнес-акаунту надіслана на розгляд',
      });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: 'Помилка',
        description: 'Не вдалося надіслати заявку',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submitVerification.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Очікує розгляду</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Схвалено</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Відхилено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-glow">
          <Crown className="w-5 h-5 mr-2" />
          Перейти на бізнес тариф
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-6 h-6 text-primary" />
            Перехід на бізнес-акаунт
          </DialogTitle>
          <DialogDescription>
            Отримайте додаткові можливості для розвитку вашого бізнесу
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current verification status */}
          {verificationRequest && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Статус верифікації</h4>
                  <p className="text-sm text-muted-foreground">
                    Заявка "{verificationRequest.business_name}"
                  </p>
                </div>
                {getStatusBadge(verificationRequest.status)}
              </div>
            </Card>
          )}

          {/* Business tariff plans */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Бізнес тарифи</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {businessTariffs?.map((tariff) => (
                <Card key={tariff.id} className={`p-4 cursor-pointer transition-colors ${
                  selectedTariff === tariff.id ? 'ring-2 ring-primary' : ''
                }`} onClick={() => setSelectedTariff(tariff.id)}>
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold">{tariff.name}</h4>
                    <div className="text-2xl font-bold text-primary">
                      {tariff.price} {tariff.currency}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      на {tariff.duration_days} днів
                    </p>
                    <p className="text-xs">{tariff.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Verification form */}
          {(!verificationRequest || verificationRequest.status === 'rejected') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold">Заявка на верифікацію</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Назва бізнесу *</Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    required
                    placeholder="ТОВ Моя Компанія"
                  />
                </div>
                
                <div>
                  <Label htmlFor="business_type">Тип бізнесу</Label>
                  <Select name="business_type">
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Роздрібна торгівля</SelectItem>
                      <SelectItem value="services">Послуги</SelectItem>
                      <SelectItem value="manufacturing">Виробництво</SelectItem>
                      <SelectItem value="it">IT та технології</SelectItem>
                      <SelectItem value="real_estate">Нерухомість</SelectItem>
                      <SelectItem value="other">Інше</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax_id">Податковий номер *</Label>
                  <Input
                    id="tax_id"
                    name="tax_id"
                    required
                    placeholder="12345678"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Веб-сайт</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Опис бізнесу</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Розкажіть коротко про ваш бізнес..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
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
                  disabled={submitVerification.isPending}
                  className="flex-1"
                >
                  {submitVerification.isPending ? 'Надсилання...' : 'Надіслати заявку'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}