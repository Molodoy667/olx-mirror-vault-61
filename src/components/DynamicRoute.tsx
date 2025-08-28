import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { isSeoUrl } from '@/lib/seo';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getUserIdByProfileId } from '@/lib/profileUtils';
import { supabase } from '@/integrations/supabase/client';

// Lazy load components to avoid conflicts with App-original
const Profile = lazy(() => import('@/pages/Profile'));
const ListingDetail = lazy(() => import('@/pages/ListingDetail'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export function DynamicRoute() {
  const { dynamicParam } = useParams<{ dynamicParam: string }>();
  const [routeType, setRouteType] = useState<'loading' | 'profile' | 'listing' | 'notfound'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const determineRouteType = async () => {
      if (!dynamicParam) {
        console.log('❌ No dynamic param provided');
        setRouteType('notfound');
        return;
      }

      console.log('🔍 DynamicRoute analyzing:', dynamicParam);

      try {
        // 1. Перевіряємо чи це SEO URL оголошення (має найвищий пріоритет)
        const testUrl = `/${dynamicParam}`;
        if (isSeoUrl(testUrl)) {
          console.log('✅ Detected SEO URL for listing:', testUrl);
          // Додаткова перевірка - чи існує таке оголошення
          const { data: seoData } = await supabase
            .from('seo_urls')
            .select('listing_id')
            .eq('full_url', testUrl)
            .single();
          
          if (seoData) {
            console.log('✅ SEO URL exists in database');
            setRouteType('listing');
            return;
          } else {
            console.log('⚠️ SEO URL pattern matches but not found in DB, checking as profile...');
          }
        } else {
          console.log('❌ Not a SEO URL:', testUrl);
        }

        // 2. Перевіряємо чи це profile_id (тільки 6 цифр)
        if (/^\d{6}$/.test(dynamicParam)) {
          console.log('✅ Detected 6-digit profile_id format');
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('profile_id', dynamicParam)
            .single();
          
          if (profileData) {
            console.log('✅ Profile found by profile_id');
            setRouteType('profile');
            return;
          } else {
            console.log('❌ Profile not found by profile_id');
          }
        }

        // 3. Перевіряємо чи це 6-символьний UUID фрагмент
        if (/^[A-F0-9]{6}$/i.test(dynamicParam)) {
          console.log('✅ Detected UUID fragment format');
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .ilike('id', `${dynamicParam}%`)
            .limit(1);
          
          if (profileData && profileData.length > 0) {
            console.log('✅ Profile found by UUID fragment');
            setRouteType('profile');
            return;
          } else {
            console.log('❌ Profile not found by UUID fragment');
          }
        }

        // 4. Перевіряємо чи це повний UUID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dynamicParam)) {
          console.log('✅ Detected full UUID format');
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', dynamicParam)
            .single();
          
          if (profileData) {
            console.log('✅ Profile found by full UUID');
            setRouteType('profile');
            return;
          } else {
            console.log('❌ Profile not found by full UUID');
          }
        }

        console.log('❌ No valid match found, showing 404');
        setRouteType('notfound');

      } catch (error) {
        console.error('❌ Error in route determination:', error);
        setRouteType('notfound');
      }
    };

    determineRouteType();
  }, [dynamicParam]);

  if (routeType === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-primary/20 to-transparent animate-pulse" />
          </div>
          <p className="text-muted-foreground bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent font-medium">
            Завантаження...
          </p>
        </div>
      </div>
    );
  }

  if (routeType === 'profile') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Profile />
      </Suspense>
    );
  }

  if (routeType === 'listing') {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ListingDetail />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NotFound />
    </Suspense>
  );
}