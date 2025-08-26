import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { ProductCardNew } from '@/components/ProductCardNew';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/useCategories';
import { SaveSearchDialog } from '@/components/SaveSearchDialog';
import { Search, Filter, X } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 100000
  ]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'date');
  const [showFilters, setShowFilters] = useState(false);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['search', query, selectedCategory, location, priceRange, sortBy],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('listings')
        .select(`
          *,
          categories (
            name,
            name_uk
          )
        `)
        .eq('status', 'active');

      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (selectedCategory && selectedCategory !== 'all') {
        queryBuilder = queryBuilder.eq('category_id', selectedCategory);
      }

      if (location) {
        queryBuilder = queryBuilder.ilike('location', `%${location}%`);
      }

      if (priceRange[0] > 0) {
        queryBuilder = queryBuilder.gte('price', priceRange[0]);
      }

      if (priceRange[1] < 100000) {
        queryBuilder = queryBuilder.lte('price', priceRange[1]);
      }

      // Sorting
      switch (sortBy) {
        case 'price_asc':
          queryBuilder = queryBuilder.order('price', { ascending: true, nullsFirst: false });
          break;
        case 'price_desc':
          queryBuilder = queryBuilder.order('price', { ascending: false, nullsFirst: false });
          break;
        case 'date':
        default:
          queryBuilder = queryBuilder
            .order('is_promoted', { ascending: false })
            .order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (location) params.set('location', location);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 100000) params.set('maxPrice', priceRange[1].toString());
    if (sortBy !== 'date') params.set('sort', sortBy);
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setLocation('');
    setPriceRange([0, 100000]);
    setSortBy('date');
    setSearchParams(new URLSearchParams());
  };

  useEffect(() => {
    handleSearch();
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-card rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Фільтри</h2>
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                >
                  Очистити
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Пошук</label>
                  <div className="relative">
                    <Input
                      placeholder="Що шукаєте?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Категорія</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Всі категорії" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі категорії</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_uk}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

                <Button onClick={handleSearch} className="w-full">
                  Застосувати фільтри
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Header */}
            <div className="bg-card rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">
                    {query ? `Результати пошуку: "${query}"` : 'Всі оголошення'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Знайдено {listings?.length || 0} оголошень
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Save Search Button */}
                  <SaveSearchDialog
                    filters={{
                      query: query || undefined,
                      category: selectedCategory === 'all' ? undefined : selectedCategory,
                      location: location || undefined,
                      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
                      maxPrice: priceRange[1] < 100000 ? priceRange[1] : undefined,
                      onlyWithPhoto: false,
                      onlyPromoted: false,
                    }}
                  />
                  
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Фільтри
                  </Button>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Найновіші</SelectItem>
                      <SelectItem value="price_asc">Дешевші</SelectItem>
                      <SelectItem value="price_desc">Дорожчі</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results */}
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
                <p className="text-muted-foreground">Нічого не знайдено</p>
                <Button onClick={clearFilters} variant="link" className="mt-2">
                  Очистити фільтри
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}