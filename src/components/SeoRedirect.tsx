import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateListingUrl } from '@/lib/seo';

interface SeoRedirectProps {
  listingId: string;
  title: string;
}

/**
 * Компонент для редиректа со старых URL на SEO-friendly URL
 */
export function SeoRedirect({ listingId, title }: SeoRedirectProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Если текущий URL в старом формате /listing/:id
    if (location.pathname.startsWith('/listing/')) {
      const seoUrl = generateListingUrl(title, listingId);
      // Редиректим на SEO URL
      navigate(seoUrl, { replace: true });
    }
  }, [listingId, title, navigate, location.pathname]);

  return null; // Компонент не рендерит ничего
}