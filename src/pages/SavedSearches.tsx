import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileNav } from '@/components/MobileNav';
import { SavedSearchCard } from '@/components/SavedSearchCard';
import { SaveSearchDialog } from '@/components/SaveSearchDialog';
import { Button } from '@/components/ui/button';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Bookmark, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SavedSearchesPage() {
  const { user } = useAuth();
  const { data: savedSearches, isLoading } = useSavedSearches();

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <Header />
        
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-md mx-auto">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Збережені пошуки</h1>
            <p className="text-muted-foreground mb-6">
              Увійдіть в акаунт, щоб переглянути збережені пошуки
            </p>
            <Link to="/auth">
              <Button>Увійти в акаунт</Button>
            </Link>
          </div>
        </div>

        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent flex items-center gap-3">
                <Bookmark className="w-8 h-8 text-primary" />
                Збережені пошуки
              </h1>
              <p className="text-muted-foreground mt-2">
                Управляйте збереженими пошуками та налаштуваннями сповіщень
              </p>
            </div>
            
            <SaveSearchDialog 
              filters={{}}
              className="hidden md:flex"
            >
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Створити пошук
              </Button>
            </SaveSearchDialog>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>{savedSearches?.length || 0} збережених пошуків</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>
                {savedSearches?.filter(s => s.notifications_enabled).length || 0} з увімкненими сповіщеннями
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-muted rounded mb-4" />
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16" />
                  <div className="h-6 bg-muted rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : savedSearches && savedSearches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSearches.map((savedSearch) => (
              <SavedSearchCard key={savedSearch.id} savedSearch={savedSearch} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 max-w-md mx-auto">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Немає збережених пошуків</h2>
            <p className="text-muted-foreground mb-6">
              Створіть перший збережений пошук, щоб отримувати сповіщення про нові оголошення
            </p>
            
            <div className="space-y-3">
              <SaveSearchDialog filters={{}}>
                <Button className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Створити збережений пошук
                </Button>
              </SaveSearchDialog>
              
              <Link to="/search">
                <Button variant="outline" className="w-full gap-2">
                  <Search className="w-4 h-4" />
                  Перейти до пошуку
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Mobile Create Button */}
        <div className="fixed bottom-24 right-4 md:hidden">
          <SaveSearchDialog filters={{}}>
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          </SaveSearchDialog>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}