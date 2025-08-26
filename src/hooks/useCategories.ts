import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  name_uk: string;
  slug: string;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  order_index: number;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          listings(count)
        `)
        .is('parent_id', null)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      return data.map(category => ({
        ...category,
        listing_count: category.listings?.[0]?.count || 0
      })) as (Category & { listing_count: number })[];
    },
  });
};

export const useCategoriesWithSubcategories = () => {
  return useQuery({
    queryKey: ['categories-with-subcategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          listings(count),
          subcategories:categories!parent_id(*)
        `)
        .is('parent_id', null)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      return data.map(category => ({
        ...category,
        listing_count: category.listings?.[0]?.count || 0,
        subcategories: category.subcategories || []
      })) as (Category & { 
        listing_count: number;
        subcategories: Category[];
      })[];
    },
  });
};