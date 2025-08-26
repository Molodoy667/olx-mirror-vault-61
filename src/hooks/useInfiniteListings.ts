import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ListingFilters {
  query?: string;
  category_id?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyWithPhoto?: boolean;
  onlyPromoted?: boolean;
}

const ITEMS_PER_PAGE = 12;

export const useInfiniteListings = (filters: ListingFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['listings', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let queryBuilder = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .range(pageParam, pageParam + ITEMS_PER_PAGE - 1)
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      if (filters.category_id) {
        queryBuilder = queryBuilder.eq('category_id', filters.category_id);
      }

      if (filters.location) {
        queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`);
      }

      if (filters.minPrice !== undefined && filters.minPrice > 0) {
        queryBuilder = queryBuilder.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined && filters.maxPrice < 100000) {
        queryBuilder = queryBuilder.lte('price', filters.maxPrice);
      }

      if (filters.onlyWithPhoto) {
        queryBuilder = queryBuilder.not('images', 'is', null);
      }

      if (filters.onlyPromoted) {
        queryBuilder = queryBuilder.eq('is_promoted', true);
      }

      const { data, error } = await queryBuilder;
      
      if (error) throw error;

      return {
        listings: data || [],
        nextPage: data && data.length === ITEMS_PER_PAGE ? pageParam + ITEMS_PER_PAGE : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};