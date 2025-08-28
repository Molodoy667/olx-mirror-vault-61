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
import { User, MapPin, Calendar, Package, Heart, Settings, Shield, BarChart3, Bell, Key, Users, MessageSquare, Star, ArrowLeft, Home } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { BusinessUpgradeDialog } from '@/components/BusinessUpgradeDialog';
import { VIPPromotionDialog } from '@/components/VIPPromotionDialog';

export default function Profile() {
  const { id } = useParams(); // ID з URL або undefined для /profile
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  // Якщо немає ID в URL (/profile), показуємо власний профіль
  const targetUserId = id || user?.id;

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', targetUserId],
    queryFn: async () => {
      console.log('🔍 Profile page analyzing targetUserId:', targetUserId);
      
      // Якщо немає ні ID, ні користувача - помилка
      if (!targetUserId) {
        console.log('❌ No target user ID and not authenticated');
        throw new Error('Unauthorized');
      }
      
      // Якщо це власний профіль (/profile), шукаємо по user.id
      if (!id && user?.id) {
        console.log('✅ Trying own profile lookup by user.id');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          console.log('✅ Found own profile');
          return data;
        } else {
          console.log('❌ Own profile not found');
          throw new Error('Own profile not found');
        }
      }

      // Якщо це чужий профіль з ID - спочатку пробуємо знайти по profile_id (6 цифр)
      if (id && id.length === 6 && /^\d+$/.test(id)) {
        console.log('✅ Trying profile_id lookup');
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('profile_id', id)
          .single();
        
        if (!error && data) {
          console.log('✅ Found profile by profile_id');
          return data;
        } else {
          console.log('❌ Not found by profile_id');
        }
      }

      // Перевіряємо чи це 6-символьний фрагмент з UUID (тимчасовий fallback)
      if (id && id.length === 6 && /^[A-F0-9]+$/i.test(id)) {
        console.log('✅ Trying UUID fragment lookup');
        // Шукаємо профіль де user_id починається з цих символів
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('id', `${id}%`);
        
        if (!error && data && data.length > 0) {
          console.log('✅ Found profile by UUID fragment');
          return data[0]; // Повертаємо перший знайдений профіль
        } else {
          console.log('❌ Not found by UUID fragment');
        }
      }
      
      console.log('✅ Trying full user ID lookup');
      // Якщо не знайшли по profile_id, пробуємо по повному user ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (error) {
        console.log('❌ Error in full ID lookup:', error);
        throw error;
      }
      console.log('✅ Found profile by full ID');
      return data;
    },
    enabled: !!targetUserId,
    retry: false
  });

  const isOwnProfile = user?.id === profile?.id;

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
      if (!profile?.id || !isOwnProfile) return [];
      
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
        .eq('user_id', profile?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: isOwnProfile,
  });

  // Loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header Skeleton */}
            <div className="bg-card rounded-lg p-4 sm:p-6 mb-6 animate-pulse">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-muted flex-shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state - profile not found
  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-card rounded-lg p-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">Профіль не знайдено</h1>
                <p className="text-muted-foreground">
                  {id ? (
                    <>Користувач з ID <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{id}</code> не існує або був видалений</>
                  ) : (
                    <>Ваш профіль не знайдено. Можливо, ви не авторизовані</>
                  )}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => navigate(-1)}
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  На головну
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
                  <div className="flex flex-col gap-3 w-full sm:w-auto">
                    {/* Primary Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {isAdmin && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => navigate('/admin')}
                          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 w-full sm:w-auto"
                        >
                          <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Адмін панель</span>
                        </Button>
                      )}
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => navigate('/edit-profile')}
                        className="bg-gradient-to-r from-primary to-primary-dark w-full sm:w-auto"
                      >
                        <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Налаштування</span>
                      </Button>
                    </div>
                    
                    {/* Secondary Action Buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/my-listings')}
                        className="w-full"
                      >
                        <Package className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate text-xs">Мої оголошення</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/messages')}
                        className="w-full"
                      >
                        <MessageSquare className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate text-xs">Повідомлення</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/notifications')}
                        className="w-full"
                      >
                        <Bell className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate text-xs">Сповіщення</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/favorites')}
                        className="w-full"
                      >
                        <Heart className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate text-xs">Обране</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Profile Stats for Own Profile */}
          {isOwnProfile && (
            <div className="bg-card rounded-lg p-4 sm:p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Статистика профілю
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="text-2xl font-bold text-primary">{listings?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Активних оголошень</div>
                </div>
                
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">{favorites?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">У обраному</div>
                </div>
                
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">{profile?.profile_id || '---'}</div>
                  <div className="text-sm text-muted-foreground">ID профілю</div>
                </div>
                
                <div className="text-center p-3 bg-background rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {profile?.created_at && formatDistanceToNow(new Date(profile.created_at), { addSuffix: false })}
                  </div>
                  <div className="text-sm text-muted-foreground">На платформі</div>
                </div>
              </div>
            </div>
          )}

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