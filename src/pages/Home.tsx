import { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/Header";
import { EnhancedSearchBar } from "@/components/EnhancedSearchBar";
import { VIPListings } from "@/components/VIPListings";
import { CategoriesSection } from "@/components/CategoriesSection";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SortDropdown } from "@/components/SortDropdown";
import { AnimatedProductCard } from "@/components/AnimatedProductCard";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { ListingCardColumn } from "@/components/ListingCardColumn";
import { GlassLoadingSpinner, GlassSkeletonCard } from "@/components/GlassLoadingSpinner";
import { VirtualScrollList } from "@/components/VirtualScrollList";

import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Filter, Grid3x3, List, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListingCardCompact } from "@/components/ListingCardCompact";
import { QuickFilters } from "@/components/QuickFilters";
import { LocationSearchDialog } from "@/components/LocationSearchDialog";
import { CategoryBrowser } from "@/components/CategoryBrowser";
import { PromoBanner } from "@/components/PromoBanner";
import { CombinedInfoSection } from "@/components/CombinedInfoSection";
import { useListings } from "@/hooks/useListings";

export default function Home() {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "columns">("grid");
  const [filters, setFilters] = useState({});
  const [quickFilters, setQuickFilters] = useState({
    isPromoted: false,
    hasImages: false,
    freeItems: false,
    recentlyAdded: false,
  });
  
  const { data: listings, isLoading } = useListings();

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleQuickFilterChange = (key: string, value: any) => {
    setQuickFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearQuickFilters = () => {
    setQuickFilters({
      isPromoted: false,
      hasImages: false,
      freeItems: false,
      recentlyAdded: false,
    });
  };

  const sortedListings = useMemo(() => {
    if (!listings) return [];
    
    return [...listings].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [listings, sortBy]);

  // Virtual scrolling for large lists (> 50 items)
  const shouldUseVirtualScrolling = (sortedListings?.length || 0) > 50;
  
  const renderListingItem = useCallback((listing: any, index: number) => {
    if (viewMode === "grid") {
      return (
        <AnimatedProductCard
          key={listing.id}
          id={listing.id}
          title={listing.title}
          price={listing.price}
          location={listing.location}
          image={listing.images?.[0] || "/placeholder.svg"}
          isPromoted={listing.is_promoted}
          createdAt={listing.created_at}
          userId={listing.user_id}
        />
      );
    } else if (viewMode === "columns") {
      return (
        <ListingCardColumn
          key={listing.id}
          id={listing.id}
          title={listing.title}
          price={listing.price}
          location={listing.location}
          image={listing.images?.[0] || "/placeholder.svg"}
          isPromoted={listing.is_promoted}
          createdAt={listing.created_at}
          description={listing.description}
        />
      );
    } else {
      return (
        <ListingCardCompact
          key={listing.id}
          id={listing.id}
          title={listing.title}
          price={listing.price}
          location={listing.location}
          image={listing.images?.[0] || "/placeholder.svg"}
          isPromoted={listing.is_promoted}
          createdAt={listing.created_at}
          views={listing.views}
        />
      );
    }
  }, [viewMode]);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <EnhancedSearchBar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12">
        <div className="container mx-auto px-4">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Знайдіть те, що шукаєте
            </h1>
            <p className="text-center text-muted-foreground text-lg">
              Мільйони оголошень від перевірених продавців
            </p>
          </div>
        </div>
      </section>

      <VIPListings />
      <CategoriesSection />
      
      {/* Listings Section */}
      <section className="container mx-auto px-4 py-8">
        {/* Header with responsive controls */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Рекомендовані оголошення</h2>
            
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-3">
              <SortDropdown value={sortBy} onChange={setSortBy} />
              
              <div className="flex gap-1 border rounded-lg p-1 bg-background">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "columns" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("columns")}
                  className="h-8 w-8"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="18" rx="1"/>
                    <rect x="14" y="3" width="7" height="18" rx="1"/>
                  </svg>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="hover:shadow-md transition-all duration-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                Фільтри
              </Button>
            </div>
          </div>
          
          {/* Mobile Controls */}
          <div className="flex md:hidden flex-col gap-3">
            <div className="flex items-center justify-between">
              <SortDropdown value={sortBy} onChange={setSortBy} />
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                size="sm"
                className="hover:shadow-md transition-all duration-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                Фільтри
              </Button>
            </div>
            
            <div className="flex gap-1 border rounded-lg p-1 bg-background w-fit">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                <Grid3x3 className="h-4 w-4 mr-1" />
                <span className="text-xs">Сітка</span>
              </Button>
              <Button
                variant={viewMode === "columns" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("columns")}
                className="h-8 px-3"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="18" rx="1"/>
                  <rect x="14" y="3" width="7" height="18" rx="1"/>
                </svg>
                <span className="text-xs">Стовпці</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-1" />
                <span className="text-xs">Список</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Filters */}
        <QuickFilters 
          filters={quickFilters}
          onFilterChange={handleQuickFilterChange}
          onClearAll={clearQuickFilters}
        />
        
        
        {isLoading ? (
          // Glass loading with skeleton cards
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : viewMode === "columns"
              ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
              : "space-y-4"
          )}>
            {[...Array(8)].map((_, i) => (
              <GlassSkeletonCard key={i} />
            ))}
          </div>
        ) : shouldUseVirtualScrolling && viewMode === "grid" ? (
          // Virtual scrolling for large lists in grid mode
          <VirtualScrollList
            items={sortedListings || []}
            itemHeight={320}
            containerHeight={800}
            className="rounded-lg border"
            renderItem={(listing, index) => (
              <div className="p-3">
                <AnimatedProductCard
                  id={listing.id}
                  title={listing.title}
                  price={listing.price}
                  location={listing.location}
                  image={listing.images?.[0] || "/placeholder.svg"}
                  isPromoted={listing.is_promoted}
                  createdAt={listing.created_at}
                  userId={listing.user_id}
                />
              </div>
            )}
          />
        ) : (
          // Regular grid/list/columns for smaller datasets
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : viewMode === "columns"
              ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
              : "space-y-4"
          )}>
            {sortedListings?.map((listing) => renderListingItem(listing, 0))}
          </div>
        )}
      </section>
      
      <CombinedInfoSection />
      <RecentlyViewed />
      
      <Footer />
      <MobileNav />
      <ScrollToTop />
      
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
        categories={["Електроніка", "Одяг", "Дім і сад", "Авто", "Робота", "Тварини", "Дитячі товари", "Послуги"]}
      />
    </div>
  );
}