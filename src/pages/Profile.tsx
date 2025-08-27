import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCardNew } from '@/components/ProductCardNew';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { User, MapPin, Calendar, Package, Heart, Settings, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BusinessUpgradeDialog } from '@/components/BusinessUpgradeDialog';
import { VIPPromotionDialog } from '@/components/VIPPromotionDialog';

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      if (!username) throw new Error('Username is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });

  const isOwnProfile = user?.username === username;

  const { data: listings } = useQuery({
    queryKey: ['user-listings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  const { data: favorites } = useQuery({
    queryKey: ['user-favorites', profile?.id],
    queryFn: async () => {
      if (!isOwnProfile || !profile?.id) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          listings (
            id,
            title,
            price,
            currency,
            location,
            images,
            is_promoted,
            created_at
          )
        `)
        .eq('user_id', profile.id);
      
      if (error) throw error;
      return data;
    },
    enabled: isOwnProfile,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-card rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold mb-2">
                    {profile?.full_name || profile?.username || 'Користувач'}
                  </h1>
                  
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">На Novado з {profile?.created_at && new Date(profile.created_at).getFullYear()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{listings?.length || 0} оголошень</span>
                    </div>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {isAdmin && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => navigate('/admin')}
                        className="bg-gradient-to-r from-primary to-primary-dark w-full sm:w-auto"
                      >
                        <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Адмін панель</span>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/edit-profile')}
                      className="w-full sm:w-auto"
                    >
                      <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Редагувати</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Business Upgrade Section */}
          {isOwnProfile && (
            <div className="mt-6">
              <BusinessUpgradeDialog />
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="listings">
              <Package className="w-4 h-4 mr-2" />
              Оголошення ({listings?.length || 0})
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="favorites">
                <Heart className="w-4 h-4 mr-2" />
                Обране ({favorites?.length || 0})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="listings">
            {listings && listings.length > 0 ? (
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
              <div className="text-center py-12 bg-card rounded-lg">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isOwnProfile ? 'У вас ще немає оголошень' : 'Користувач ще не має оголошень'}
                </p>
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="favorites">
              {favorites && favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {favorites.map((fav) => fav.listings && (
                    <ProductCardNew
                      key={fav.listings.id}
                      id={fav.listings.id}
                      title={fav.listings.title}
                      price={fav.listings.price || 0}
                      currency={fav.listings.currency}
                      location={fav.listings.location}
                      image={fav.listings.images?.[0] || '/placeholder.svg'}
                      isPromoted={fav.listings.is_promoted}
                      createdAt={fav.listings.created_at}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-lg">
                  <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">У вас ще немає обраних оголошень</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}