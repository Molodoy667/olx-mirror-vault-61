import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface SimilarListingsProps {
  categoryId?: number;
  currentListingId: string;
  location?: string;
}

export function SimilarListings({ categoryId, currentListingId, location }: SimilarListingsProps) {
  const { data: listings, isLoading } = useQuery({
    queryKey: ['similar-listings', categoryId, currentListingId],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .neq('id', currentListingId)
        .limit(10);

      if (categoryId) {
        query = query.eq('category_id', categoryId.toString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Sort by location if provided
      if (location && data) {
        return data.sort((a, b) => {
          const aMatch = a.location === location ? 1 : 0;
          const bMatch = b.location === location ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      return data || [];
    },
    enabled: !!currentListingId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Схожі оголошення
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Схожі оголошення
        </h2>
        <p className="text-sm text-muted-foreground">
          {listings.length} оголошень
        </p>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {listings.map((listing) => (
            <CarouselItem key={listing.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <ProductCard 
                id={listing.id}
                title={listing.title}
                price={listing.price ? `${listing.price.toLocaleString('uk-UA')} ${listing.currency}` : 'Безкоштовно'}
                location={listing.location}
                date={new Date(listing.created_at).toLocaleDateString('uk-UA')}
                image={listing.images?.[0] || '/placeholder.svg'}
                isPromoted={listing.is_promoted}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-12 hover:shadow-glow" />
        <CarouselNext className="hidden md:flex -right-12 hover:shadow-glow" />
      </Carousel>
    </div>
  );
}