import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import * as LucideIcons from "lucide-react";

// Icon mapping function
const getIconComponent = (iconName: string | null) => {
  if (!iconName) return LucideIcons.Package;
  const IconComponent = (LucideIcons as Record<string, unknown>)[iconName];
  return IconComponent || LucideIcons.Package;
};

export function CategorySlider() {
  const navigate = useNavigate();
  const [api, setApi] = useState<unknown>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const { data: categories, isLoading } = useCategories();

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/category/${categorySlug}`);
  };

  return (
    <section className="py-8 px-4 bg-gradient-to-b from-background to-accent/5">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Категорії
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Знайдіть те, що вам потрібно
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary font-medium">{current}</span>
            <span>/</span>
            <span>{count}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-3 p-4">
                <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
                <div className="w-12 h-3 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <Carousel
            setApi={setApi}
            className="w-full"
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: true,
              }),
            ]}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {categories?.map((category) => {
                const Icon = getIconComponent(category.icon);
                const gradientClass = `bg-gradient-to-br ${category.color?.includes('#') ? '' : category.color || 'from-primary to-primary-dark'}`;
                
                return (
                  <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <div
                      onClick={() => handleCategoryClick(category.slug)}
                      className="cursor-pointer group p-4"
                    >
                      <div className="flex flex-col items-center space-y-3">
                        {/* Circular icon container */}
                        <div 
                          className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center",
                            "shadow-lg group-hover:scale-110 group-hover:shadow-xl",
                            "transition-all duration-300 ease-out relative overflow-hidden"
                          )}
                          style={{
                            background: category.color?.includes('#') 
                              ? `linear-gradient(135deg, ${category.color}, ${category.color}88)`
                              : undefined
                          }}
                        >
                          {/* Hover glow effect */}
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <Icon className="w-10 h-10 text-white relative z-10" />
                        </div>
                        
                        {/* Category name */}
                        <div className="text-center">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors duration-200 line-clamp-2">
                            {category.name_uk || category.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {category.listing_count?.toLocaleString('uk-UA') || '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 bg-background hover:bg-accent hover:text-accent-foreground" />
            <CarouselNext className="hidden md:flex -right-12 bg-background hover:bg-accent hover:text-accent-foreground" />
          </Carousel>
        )}

        {/* Mobile dots indicator */}
        <div className="flex justify-center gap-1 mt-4 md:hidden">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                current === index + 1
                  ? "w-8 bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}