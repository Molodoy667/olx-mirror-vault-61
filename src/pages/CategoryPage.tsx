import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCardNew } from '@/components/ProductCardNew';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Filter } from 'lucide-react';
import { useState } from 'react';

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState('date');

  const { data: category } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: listings, isLoading } = useQuery({
    queryKey: ['category-listings', category?.id, location, priceRange, sortBy],
    queryFn: async () => {
      if (!category) return [];
      
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .eq('category_id', category.id);

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      if (priceRange[0] > 0) {
        query = query.gte('price', priceRange[0]);
      }

      if (priceRange[1] < 100000) {
        query = query.lte('price', priceRange[1]);
      }

      // Sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true, nullsFirst: false });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false, nullsFirst: false });
          break;
        default:
          query = query
            .order('is_promoted', { ascending: false })
            .order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!category,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Головна
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{category?.name_uk}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters */}
          <div className="lg:w-64">
            <div className="bg-card rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold">Фільтри</h2>
              
              <Separator />

              <div>
                <label className="text-sm font-medium mb-2 block">Місцезнаходження</label>
                <Input
                  placeholder="Місто або область"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Ціна: {priceRange[0]} - {priceRange[1]} грн
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={100000}
                  step={100}
                  className="mt-3"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Сортування</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Найновіші</option>
                  <option value="price_asc">Дешевші</option>
                  <option value="price_desc">Дорожчі</option>
                </select>
              </div>
            </div>
          </div>

          {/* Listings */}
          <div className="flex-1">
            <div className="bg-card rounded-lg p-4 mb-6">
              <h1 className="text-xl font-semibold">{category?.name_uk}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Знайдено {listings?.length || 0} оголошень
              </p>
            </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listings.map((listing) => (
                  <ProductCardNew
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    price={listing.price || 0}
                    currency={listing.currency}
                    location={listing.location}
                    image={listing.images?.[0] || '/placeholder.svg'}
                    isPromoted={listing.is_promoted}
                    createdAt={listing.created_at}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">У цій категорії поки немає оголошень</p>
                <Button onClick={() => navigate('/create')} className="mt-4">
                  Створити перше оголошення
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}