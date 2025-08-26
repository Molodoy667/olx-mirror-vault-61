import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCardNew } from '@/components/ProductCardNew';
import { Heart, Package } from 'lucide-react';

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['user-favorites', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listings (
            id,
            title,
            price,
            currency,
            location,
            images,
            is_promoted,
            created_at,
            status
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.filter(fav => fav.listings?.status === 'active');
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Обрані оголошення</h1>
        
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
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((fav) => fav.listings && (
              <ProductCardNew
                key={fav.listings.id}
                id={fav.listings.id}
                title={fav.listings.title}
                price={fav.listings.price || 0}
                currency={fav.listings.currency}
                location={fav.listings.location}
                image={fav.listings.images?.[0] || '/placeholder.svg'}
                isPromoted={fav.listings.is_promoted}
                createdAt={fav.listings.created_at}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">У вас ще немає обраних оголошень</p>
            <button
              onClick={() => navigate('/search')}
              className="text-primary hover:underline"
            >
              Переглянути всі оголошення
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}