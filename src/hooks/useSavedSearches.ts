import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string | null;
  category_id: string | null;
  location: string | null;
  min_price: number | null;
  max_price: number | null;
  condition: string | null;
  only_with_photo: boolean;
  only_promoted: boolean;
  notifications_enabled: boolean;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedSearchFilters {
  query?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  onlyWithPhoto?: boolean;
  onlyPromoted?: boolean;
}

export const useSavedSearches = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-searches', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_searches')
        .select(`
          *,
          categories (
            name,
            name_uk
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (SavedSearch & { categories?: { name: string; name_uk: string } })[];
    },
    enabled: !!user,
  });
};

export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      filters: SavedSearchFilters;
      notificationsEnabled?: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const savedSearch = {
        user_id: user.id,
        name: data.name,
        query: data.filters.query || null,
        category_id: data.filters.category || null,
        location: data.filters.location || null,
        min_price: data.filters.minPrice || null,
        max_price: data.filters.maxPrice || null,
        condition: data.filters.condition || null,
        only_with_photo: data.filters.onlyWithPhoto || false,
        only_promoted: data.filters.onlyPromoted || false,
        notifications_enabled: data.notificationsEnabled ?? true,
      };

      const { data: result, error } = await supabase
        .from('saved_searches')
        .insert(savedSearch)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Пошук збережено!');
    },
    onError: (error) => {
      console.error('Error creating saved search:', error);
      toast.error('Помилка збереження пошуку');
    },
  });
};

export const useUpdateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      id: string; 
      updates: Partial<SavedSearch> 
    }) => {
      const { data: result, error } = await supabase
        .from('saved_searches')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Пошук оновлено!');
    },
    onError: (error) => {
      console.error('Error updating saved search:', error);
      toast.error('Помилка оновлення пошуку');
    },
  });
};

export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Пошук видалено!');
    },
    onError: (error) => {
      console.error('Error deleting saved search:', error);
      toast.error('Помилка видалення пошуку');
    },
  });
};