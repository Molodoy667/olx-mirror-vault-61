import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ImageGallery } from '@/components/ImageGallery';
import { SimilarListings } from '@/components/SimilarListings';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ReviewsSection } from '@/components/listing/ReviewsSection';
import { QuestionsSection } from '@/components/listing/QuestionsSection';
import { ListingHeader } from '@/components/listing/ListingHeader';
import { ListingDescription } from '@/components/listing/ListingDescription';
import { ListingDetails } from '@/components/listing/ListingDetails';
import { ListingSidebar } from '@/components/listing/ListingSidebar';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          categories:category_id (
            name,
            name_uk
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Increment views only once per session
      if (!sessionStorage.getItem(`viewed-${id}`)) {
        await supabase
          .from('listings')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id);
        
        sessionStorage.setItem(`viewed-${id}`, 'true');
      }

      return data;
    },
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites', id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('listing_id', id!);

      if (error) throw error;
      setIsFavorite(data.length > 0);
      return data;
    },
    enabled: !!user && !!id,
  });

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Потрібна авторизація",
        description: "Увійдіть, щоб додати до обраного",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id!);
        
        setIsFavorite(false);
        toast({
          title: "Видалено з обраного",
        });
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: id });
        
        setIsFavorite(true);
        toast({
          title: "Додано до обраного",
        });
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити обране",
        variant: "destructive",
      });
    }
  };

  const handleContact = async () => {
    if (!user) {
      toast({
        title: "Потрібна авторизація",
        description: "Увійдіть, щоб зв'язатися з продавцем",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    // Create initial message about the listing
    try {
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: listing?.user_id,
          content: `Вітаю! Мене цікавить ваше оголошення "${listing?.title}"`,
          listing_id: id,
        });
      
      // Navigate to messages with listing context
      navigate(`/messages/${listing?.user_id}`);
    } catch (error) {
      // If message already exists or error, just navigate
      navigate(`/messages/${listing?.user_id}`);
    }
  };

  const handleShare = () => {
    navigator.share?.({
      title: listing?.title,
      text: listing?.description || '',
      url: window.location.href,
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Посилання скопійовано",
        description: "Ви можете поділитися ним з друзями",
      });
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-6" />
            <div className="h-8 bg-muted rounded w-1/2 mb-4" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Оголошення не знайдено</h2>
            <Button onClick={() => navigate('/')}>Повернутися на головну</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const images = listing.images || ['/placeholder.svg'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">
            Головна
          </button>
          <span>/</span>
          {listing.categories && (
            <>
              <button 
                onClick={() => navigate(`/category/${listing.categories.name_uk.toLowerCase()}`)}
                className="hover:text-primary transition-colors"
              >
                {listing.categories.name_uk}
              </button>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={images} title={listing.title} />

            {/* Title and Price */}
            <ListingHeader 
              listing={listing}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              onContact={handleContact}
              onShare={handleShare}
            />

            {/* Description */}
            <ListingDescription description={listing.description} />

            {/* Additional Details */}
            <ListingDetails listing={listing} />

            {/* Reviews Section */}
            <ReviewsSection listingId={listing.id} />

            {/* Questions Section */}
            <QuestionsSection listingId={listing.id} sellerId={listing.user_id} />
          </div>

          {/* Sidebar */}
          <ListingSidebar 
            listing={listing}
            user={user}
            onContact={handleContact}
          />
        </div>

        {/* Similar Listings */}
        <div className="mt-12">
          <SimilarListings 
            categoryId={listing.category_id ? parseInt(listing.category_id) : undefined}
            currentListingId={listing.id}
            location={listing.location}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}