import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCardNew } from '@/components/ProductCardNew';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Eye, EyeOff, Trash2, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getOrCreateSeoUrl } from '@/lib/seo';

export default function MyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings', user?.id || '', activeTab],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', activeTab)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast({
        title: newStatus === 'active' ? 'Оголошення активовано' : 'Оголошення деактивовано',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast({
        title: 'Оголошення видалено',
      });
    },
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Мої оголошення</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              <Eye className="w-4 h-4 mr-2" />
              Активні
            </TabsTrigger>
            <TabsTrigger value="inactive">
              <EyeOff className="w-4 h-4 mr-2" />
              Неактивні
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-3" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : listings && listings.length > 0 ? (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-card rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <img
                      src={listing.images?.[0] || '/placeholder.svg'}
                      alt={listing.title}
                      className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-2">{listing.title}</h3>
                      <p className="text-muted-foreground mb-2 font-medium">
                        {listing.price ? `${listing.price.toLocaleString('uk-UA')} ${listing.currency}` : 'Безкоштовно'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {listing.views} переглядів • {listing.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const seoUrl = await getOrCreateSeoUrl(listing.id, listing.title);
                            navigate(seoUrl);
                          } catch (error) {
                            console.error('Error navigating to listing:', error);
                            navigate(`/listing/${listing.id}`);
                          }
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <span className="sm:hidden">Переглянути</span>
                        <span className="hidden sm:inline">Переглянути</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/edit/${listing.id}`)}
                        className="flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="sr-only">Редагувати</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ 
                          id: listing.id, 
                          currentStatus: listing.status 
                        })}
                        className="flex-shrink-0"
                      >
                        {listing.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="sr-only">{listing.status === 'active' ? 'Деактивувати' : 'Активувати'}</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Ви впевнені, що хочете видалити це оголошення?')) {
                            deleteMutation.mutate(listing.id);
                          }
                        }}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Видалити</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-lg">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  У вас немає {activeTab === 'active' ? 'активних' : 'неактивних'} оголошень
                </p>
                {activeTab === 'active' && (
                  <Button onClick={() => navigate('/create')}>
                    Створити оголошення
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}