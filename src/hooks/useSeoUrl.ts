import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateListingUrl, extractListingIdFromUrl } from '@/lib/seo';

/**
 * Хук для работы с SEO-friendly URL объявлений
 */
export function useSeoUrl() {
  const navigate = useNavigate();

  /**
   * Переход к объявлению по SEO-friendly URL
   */
  const navigateToListing = useCallback((title: string, id: string) => {
    const seoUrl = generateListingUrl(title, id);
    navigate(seoUrl);
  }, [navigate]);

  /**
   * Получение ID объявления из текущего URL
   */
  const getListingIdFromUrl = useCallback((url: string) => {
    return extractListingIdFromUrl(url);
  }, []);

  /**
   * Генерация SEO-friendly URL для объявления
   */
  const generateUrl = useCallback((title: string, id: string) => {
    return generateListingUrl(title, id);
  }, []);

  return {
    navigateToListing,
    getListingIdFromUrl,
    generateUrl,
  };
}