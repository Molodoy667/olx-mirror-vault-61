import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Listing {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  location: string;
  images: string[] | null;
  status: string;
  is_promoted: boolean;
  promoted_until: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

export const useListings = (limit?: number) => {
  return useQuery({
    queryKey: ['listings', limit],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Listing[];
    },
  });
};

export const useFeaturedListings = () => {
  return useQuery({
    queryKey: ['featured-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Listing[];
    },
  });
};