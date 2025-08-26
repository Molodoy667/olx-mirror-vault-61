import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useListingStats = (listingId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Получаем статистику просмотров
  const { data: stats } = useQuery({
    queryKey: ['listing-stats', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_stats')
        .select('*')
        .eq('listing_id', listingId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  // Мутация для записи просмотра
  const recordViewMutation = useMutation({
    mutationFn: async ({ ipAddress, userAgent }: { ipAddress?: string; userAgent?: string }) => {
      const { error } = await supabase
        .from('listing_views')
        .insert({
          listing_id: listingId,
          user_id: user?.id || null,
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Обновляем кэш статистики
      queryClient.invalidateQueries({ queryKey: ['listing-stats', listingId] });
    },
  });

  // Мутация для записи контакта
  const recordContactMutation = useMutation({
    mutationFn: async (contactType: 'phone' | 'chat' | 'view_phone') => {
      if (!user) {
        throw new Error('Необходимо войти в систему');
      }

      const { error } = await supabase
        .from('listing_contacts')
        .insert({
          listing_id: listingId,
          contacted_by: user.id,
          contact_type: contactType,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Обновляем статистику
      queryClient.invalidateQueries({ queryKey: ['listing-stats', listingId] });
    },
  });

  return {
    stats,
    recordView: recordViewMutation.mutate,
    recordContact: recordContactMutation.mutate,
  };
};