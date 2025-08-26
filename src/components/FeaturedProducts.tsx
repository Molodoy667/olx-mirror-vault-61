import { ProductCard } from "./ProductCard";
import { useFeaturedListings } from "@/hooks/useListings";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate, formatPrice } from "@/utils/dateHelpers";

export function FeaturedProducts() {
  const { data: listings, isLoading } = useFeaturedListings();

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Рекомендовані оголошення</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-4">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Use demo data if no listings in database
  const demoProducts = [
    {
      id: "1",
      title: "iPhone 13 Pro Max 256GB Sierra Blue",
      price: "25 000 грн",
      location: "Київ",
      date: "Сьогодні",
      image: "https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400&h=300&fit=crop",
      isPromoted: true
    },
    {
      id: "2",
      title: "Квартира 2-кімнатна в центрі міста",
      price: "45 000 грн",
      location: "Львів",
      date: "Вчора",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop",
      isPromoted: true
    },
    {
      id: "3",
      title: "Mercedes-Benz C-Class 2020",
      price: "35 000 $",
      location: "Одеса",
      date: "2 дні тому",
      image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=300&fit=crop",
      isPromoted: false
    },
    {
      id: "4",
      title: "MacBook Pro 14 M2 Pro",
      price: "75 000 грн",
      location: "Харків",
      date: "Сьогодні",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
      isPromoted: false
    },
    {
      id: "5",
      title: "Диван розкладний новий",
      price: "12 000 грн",
      location: "Дніпро",
      date: "3 дні тому",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
      isPromoted: false
    },
    {
      id: "6",
      title: "PlayStation 5 з іграми",
      price: "18 000 грн",
      location: "Запоріжжя",
      date: "Вчора",
      image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop",
      isPromoted: true
    },
    {
      id: "7",
      title: "Велосипед гірський Trek",
      price: "15 000 грн",
      location: "Вінниця",
      date: "Сьогодні",
      image: "https://images.unsplash.com/photo-1553978297-833d09932d31?w=400&h=300&fit=crop",
      isPromoted: false
    },
    {
      id: "8",
      title: "Кошеня британської породи",
      price: "3 000 грн",
      location: "Полтава",
      date: "4 дні тому",
      image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop",
      isPromoted: false
    }
  ];

  const products = listings && listings.length > 0
    ? listings.map(listing => ({
        id: listing.id,
        title: listing.title,
        price: formatPrice(listing.price, listing.currency),
        location: listing.location,
        date: formatRelativeDate(listing.created_at),
        image: listing.images?.[0] || "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=300&fit=crop",
        isPromoted: listing.is_promoted
      }))
    : demoProducts;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8">Рекомендовані оголошення</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
        
        {/* Кнопка "Переглянути всі" */}
        <div className="text-center mt-8">
          <button 
            onClick={() => window.location.href = '/search'}
            className="px-8 py-3 bg-white border-2 border-primary text-primary font-semibold rounded-md hover:bg-primary hover:text-white transition-colors"
          >
            Переглянути всі оголошення
          </button>
        </div>
      </div>
    </section>
  );
}