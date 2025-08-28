import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrCreateSeoUrl, getSeoUrl, getListingIdBySeoUrl } from '@/lib/seo';

/**
 * Хук для работы с SEO-friendly URL объявлений
 */
export function useSeoUrl() {
  const navigate = useNavigate();

  /**
   * Переход к объявлению по SEO-friendly URL
   */
  const navigateToListing = useCallback(async (title: string, id: string) => {
    try {
      const seoUrl = await getOrCreateSeoUrl(id, title);
      navigate(seoUrl);
    } catch (error) {
      console.error('Error navigating to listing:', error);
      navigate(`/listing/${id}`);
    }
  }, [navigate]);

  /**
   * Получение ID объявления из SEO URL
   */
  const getListingIdFromSeoUrl = useCallback(async (seoUrl: string) => {
    return await getListingIdBySeoUrl(seoUrl);
  }, []);

  /**
   * Получение SEO URL для объявления
   */
  const getSeoUrlForListing = useCallback(async (listingId: string) => {
    return await getSeoUrl(listingId);
  }, []);

  /**
   * Создание или получение SEO URL для объявления
   */
  const createOrGetSeoUrl = useCallback(async (listingId: string, title: string) => {
    return await getOrCreateSeoUrl(listingId, title);
  }, []);

  return {
    navigateToListing,
    getListingIdFromSeoUrl,
    getSeoUrlForListing,
    createOrGetSeoUrl,
  };
}