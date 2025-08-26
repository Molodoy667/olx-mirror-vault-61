import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useCategoriesWithSubcategories } from "@/hooks/useCategories";
import * as LucideIcons from "lucide-react";
import { ChevronRight, Grid3x3 } from "lucide-react";

// Icon mapping function
const getIconComponent = (iconName: string | null) => {
  if (!iconName) return LucideIcons.Package;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.Package;
};

interface Category {
  id: string;
  name: string;
  name_uk: string;
  slug: string;
  icon: string | null;
  color: string | null;
  listing_count: number;
  subcategories: {
    id: string;
    name: string;
    name_uk: string;
    slug: string;
    icon: string | null;
    color: string | null;
  }[];
}

export function CategoriesSection() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [api, setApi] = useState<any>();
  const { data: categories, isLoading } = useCategoriesWithSubcategories();

  const handleCategoryClick = (category: Category) => {
    if (category.subcategories.length > 0) {
      setSelectedCategory(category);
      setShowSubcategories(true);
    } else {
      navigate(`/category/${category.slug}`);
    }
  };

  const handleSubcategoryClick = (subcategorySlug: string) => {
    navigate(`/category/${subcategorySlug}`);
    setShowSubcategories(false);
  };

  const handleViewAllClick = () => {
    if (selectedCategory) {
      navigate(`/category/${selectedCategory.slug}`);
      setShowSubcategories(false);
    }
  };

  return (
    <>
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent flex items-center gap-2">
                <Grid3x3 className="w-6 h-6 text-primary" />
                Категорії
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Знайдіть потрібну категорію
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center p-6 bg-card rounded-xl border animate-pulse">
                  <div className="w-16 h-16 bg-muted rounded-xl mr-4" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded mb-2 w-1/3" />
                    <div className="h-4 bg-muted rounded mb-3 w-1/4" />
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-6 bg-muted rounded w-20" />
                      ))}
                    </div>
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
                  loop: false,
                }}
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {/* Group categories by 2 for each slide */}
                  {categories && categories.length > 0 && Array.from({ length: Math.ceil(categories.length / 2) }, (_, i) => {
                    const startIndex = i * 2;
                    const slideCategories = categories.slice(startIndex, startIndex + 2);
                    
                    return (
                      <CarouselItem key={`slide-${i}`} className="pl-2 md:pl-4 basis-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {slideCategories.map((category) => {
                            const Icon = getIconComponent(category.icon);
                            const visibleSubcategories = category.subcategories?.slice(0, 3) || [];
                            const remainingCount = Math.max(0, (category.subcategories?.length || 0) - 3);
                            
                            return (
                              <div
                                key={category.id}
                                onClick={() => handleCategoryClick(category)}
                                className="cursor-pointer group flex items-center p-6 bg-card hover:bg-accent/50 rounded-xl border border-border hover:border-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 h-full"
                              >
                                {/* Icon */}
                                <div 
                                  className="w-16 h-16 rounded-xl flex items-center justify-center mr-4 group-hover:scale-105 transition-transform duration-200 shadow-md"
                                  style={{
                                    background: category.color?.includes('#') 
                                      ? `linear-gradient(135deg, ${category.color}, ${category.color}88)`
                                      : 'hsl(var(--primary))'
                                  }}
                                >
                                  <Icon className="w-8 h-8 text-white" />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-200 mb-1">
                                    {category.name_uk || category.name}
                                  </h3>
                                  <p className="text-muted-foreground text-sm mb-3">
                                    {category.listing_count?.toLocaleString('uk-UA') || 0} оголошень
                                  </p>
                                  
                                  {/* Subcategories */}
                                  {visibleSubcategories.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {visibleSubcategories.map((subcategory) => (
                                        <Badge 
                                          key={subcategory.id}
                                          variant="secondary"
                                          className="text-xs hover:bg-primary/10 transition-colors duration-200"
                                        >
                                          {subcategory.name_uk || subcategory.name}
                                        </Badge>
                                      ))}
                                      {remainingCount > 0 && (
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs text-primary border-primary/30"
                                        >
                                          +{remainingCount}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Arrow */}
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 ml-4" />
                              </div>
                            );
                          })}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                
                {/* Carousel Navigation Buttons */}
                <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground border-primary hover:bg-primary-dark hover:shadow-lg transition-all duration-200 w-12 h-12 shadow-md" />
                <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground border-primary hover:bg-primary-dark hover:shadow-lg transition-all duration-200 w-12 h-12 shadow-md" />
              </Carousel>
            </div>
          )}
        </div>
      </section>

      {/* Subcategories Dialog */}
      <Dialog open={showSubcategories} onOpenChange={setShowSubcategories}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedCategory && (
                <>
                  {(() => {
                    const Icon = getIconComponent(selectedCategory.icon);
                    return (
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: selectedCategory.color?.includes('#') 
                            ? `linear-gradient(135deg, ${selectedCategory.color}, ${selectedCategory.color}88)`
                            : 'hsl(var(--primary))'
                        }}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    );
                  })()}
                  {selectedCategory.name_uk || selectedCategory.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {/* View All Button */}
            <Button 
              onClick={handleViewAllClick}
              variant="outline"
              className="w-full justify-start font-semibold"
            >
              Переглянути всі в категорії
            </Button>
            
            {/* Subcategories */}
            {selectedCategory?.subcategories.map((subcategory) => {
              const SubIcon = getIconComponent(subcategory.icon);
              return (
                <button
                  key={subcategory.id}
                  onClick={() => handleSubcategoryClick(subcategory.slug)}
                  className="w-full flex items-center p-3 text-left hover:bg-accent rounded-lg transition-colors duration-200 group"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200"
                    style={{
                      background: subcategory.color?.includes('#') 
                        ? `linear-gradient(135deg, ${subcategory.color}, ${subcategory.color}88)`
                        : 'hsl(var(--muted))'
                    }}
                  >
                    <SubIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium group-hover:text-primary transition-colors duration-200">
                    {subcategory.name_uk || subcategory.name}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}