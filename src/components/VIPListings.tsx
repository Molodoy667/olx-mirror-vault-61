import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrCreateSeoUrl } from "@/lib/seo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import { useFeaturedListings } from "@/hooks/useListings";
import { MapPin, Eye, Clock, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

export function VIPListings() {
  const navigate = useNavigate();
  const [api, setApi] = useState<any>();
  const { data: listings, isLoading } = useFeaturedListings();

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {});
  }, [api]);

  const handleListingClick = async (listingId: string, title: string) => {
    try {
      const seoUrl = await getOrCreateSeoUrl(listingId, title);
      navigate(seoUrl);
    } catch (error) {
      console.error('Error navigating to listing:', error);
      navigate(`/listing/${listingId}`);
    }
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return "Ціну не вказано";
    return `${price.toLocaleString('uk-UA')} ${currency}`;
  };

  return (
    <section className="py-8 px-4 bg-gradient-to-b from-accent/5 to-background">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              VIP Оголошення
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Рекомендовані та просунуті оголошення
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative h-48 bg-muted rounded-lg animate-pulse overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="h-4 bg-white/20 rounded mb-2" />
                  <div className="h-3 bg-white/20 rounded w-1/2 mb-1" />
                  <div className="h-3 bg-white/20 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <Carousel
              setApi={setApi}
              className="w-full"
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: true,
                }),
              ]}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {listings?.map((listing) => (
                  <CarouselItem key={listing.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <div
                      onClick={() => handleListingClick(listing.id, listing.title)}
                      className="cursor-pointer group relative h-48 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${listing.images?.[0] || '/placeholder.svg'})`,
                        }}
                      />
                      
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* VIP Badge */}
                      {listing.is_promoted && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                          VIP
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-yellow-300 transition-colors duration-200">
                          {listing.title}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-yellow-300 font-bold text-lg">
                            {formatPrice(listing.price, listing.currency)}
                          </span>
                          {listing.views > 0 && (
                            <div className="flex items-center gap-1 text-white/80 text-sm">
                              <Eye className="w-3 h-3" />
                              <span>{listing.views}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-white/90">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{listing.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDistanceToNow(new Date(listing.created_at), {
                                addSuffix: true,
                                locale: uk,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Carousel Navigation Buttons */}
              <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600 hover:shadow-lg transition-all duration-200 w-12 h-12 shadow-md" />
              <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600 hover:shadow-lg transition-all duration-200 w-12 h-12 shadow-md" />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}