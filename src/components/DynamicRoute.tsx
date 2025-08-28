import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Profile from '@/pages/Profile';
import ListingDetail from '@/pages/ListingDetail';
import NotFound from '@/pages/NotFound';
import { isSeoUrl } from '@/lib/seo';
import { getUserIdByProfileId } from '@/lib/profileUtils';

export function DynamicRoute() {
  const { dynamicParam } = useParams<{ dynamicParam: string }>();
  const [routeType, setRouteType] = useState<'loading' | 'profile' | 'listing' | 'notfound'>('loading');

  useEffect(() => {
    const determineRouteType = async () => {
      if (!dynamicParam) {
        setRouteType('notfound');
        return;
      }

      // Перевіряємо чи це profile_id (тільки 6 цифр)
      if (/^\d{6}$/.test(dynamicParam)) {
        // Спочатку перевіряємо чи існує такий profile_id
        const userId = await getUserIdByProfileId(dynamicParam);
        if (userId) {
          setRouteType('profile');
          return;
        }
      }

      // Перевіряємо чи це 6-символьний фрагмент з UUID (тимчасовий fallback)
      if (/^[A-F0-9]{6}$/i.test(dynamicParam)) {
        setRouteType('profile');
        return;
      }

      // Перевіряємо чи це SEO URL оголошення (містить дефіс і 6 символів після)
      if (isSeoUrl(`/${dynamicParam}`)) {
        setRouteType('listing');
        return;
      }

      // Якщо нічого не підійшло
      setRouteType('notfound');
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
    return <Profile />;
  }

  if (routeType === 'listing') {
    return <ListingDetail />;
  }

  return <NotFound />;
}