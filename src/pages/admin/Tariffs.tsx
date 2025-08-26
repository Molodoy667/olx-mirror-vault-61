import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';

interface TariffPlan {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  duration_days: number;
  description: string;
  is_active: boolean;
}

export default function Tariffs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<TariffPlan | null>(null);
  const queryClient = useQueryClient();

  const { data: tariffs, isLoading } = useQuery({
    queryKey: ['admin-tariffs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select('*')
        .order('type', { ascending: true })
        .order('price', { ascending: true });

      if (error) throw error;
      return data as TariffPlan[];
    },
  });

  const createTariff = useMutation({
    mutationFn: async (tariff: Omit<TariffPlan, 'id'>) => {
      const { error } = await supabase
        .from('tariff_plans')
        .insert(tariff);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tariffs'] });
      toast({ title: 'Тариф створено успішно' });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити тариф',
        variant: 'destructive',
      });
    },
  });

  const updateTariff = useMutation({
    mutationFn: async (tariff: TariffPlan) => {
      const { error } = await supabase
        .from('tariff_plans')
        .update(tariff)
        .eq('id', tariff.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tariffs'] });
      toast({ title: 'Тариф оновлено успішно' });
      setIsDialogOpen(false);
      setEditingTariff(null);
    },
  });

  const deleteTariff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tariff_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tariffs'] });
      toast({ title: 'Тариф видалено успішно' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const tariffData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      price: Number(formData.get('price')),
      currency: formData.get('currency') as string,
      duration_days: Number(formData.get('duration_days')),
      description: formData.get('description') as string,
      is_active: formData.get('is_active') === 'true',
    };

    if (editingTariff) {
      updateTariff.mutate({ ...tariffData, id: editingTariff.id });
    } else {
      createTariff.mutate(tariffData);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vip_listing': return 'VIP Оголошення';
      case 'promo_listing': return 'Промо Оголошення';
      case 'business_account': return 'Бізнес Акаунт';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Управління тарифами</h1>
              <p className="text-muted-foreground mt-2">
                Налаштування цін та тривалості тарифних планів
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setEditingTariff(null)}
                  className="bg-gradient-to-r from-primary to-primary-glow"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Додати тариф
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingTariff ? 'Редагувати тариф' : 'Створити новий тариф'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Назва тарифу</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingTariff?.name || ''}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Тип тарифу</Label>
                    <Select name="type" defaultValue={editingTariff?.type || ''} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vip_listing">VIP Оголошення</SelectItem>
                        <SelectItem value="promo_listing">Промо Оголошення</SelectItem>
                        <SelectItem value="business_account">Бізнес Акаунт</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="price">Ціна</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        defaultValue={editingTariff?.price || ''}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="currency">Валюта</Label>
                      <Select name="currency" defaultValue={editingTariff?.currency || 'UAH'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UAH">UAH</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration_days">Тривалість (днів)</Label>
                    <Input
                      id="duration_days"
                      name="duration_days"
                      type="number"
                      defaultValue={editingTariff?.duration_days || ''}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Опис</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={editingTariff?.description || ''}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="is_active">Статус</Label>
                    <Select name="is_active" defaultValue={editingTariff?.is_active ? 'true' : 'false'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Активний</SelectItem>
                        <SelectItem value="false">Неактивний</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingTariff(null);
                      }}
                      className="flex-1"
                    >
                      Скасувати
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTariff.isPending || updateTariff.isPending}
                      className="flex-1"
                    >
                      {editingTariff ? 'Оновити' : 'Створити'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              <div className="text-center py-8">Завантаження...</div>
            ) : (
              tariffs?.map((tariff) => (
                <Card key={tariff.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{tariff.name}</h3>
                        <Badge variant={tariff.is_active ? 'default' : 'secondary'}>
                          {tariff.is_active ? 'Активний' : 'Неактивний'}
                        </Badge>
                        <Badge variant="outline">{getTypeLabel(tariff.type)}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">
                            {tariff.price} {tariff.currency}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{tariff.duration_days} днів</span>
                      </div>
                      
                      {tariff.description && (
                        <p className="text-muted-foreground">{tariff.description}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTariff(tariff);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTariff.mutate(tariff.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}