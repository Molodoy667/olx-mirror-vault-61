import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useListingLikes = (listingId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Проверяем лайкнул ли текущий пользователь
  const { data: userLike } = useQuery({
    queryKey: ['listing-user-like', listingId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('listing_likes')
        .select('*')
        .eq('listing_id', listingId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!listingId,
  });

  // Получаем общую статистику лайков
  const { data: likesStats } = useQuery({
    queryKey: ['listing-likes-stats', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_stats')
        .select('likes_total')
        .eq('listing_id', listingId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.likes_total || 0;
    },
    enabled: !!listingId,
  });

  // Мутация для лайка/дизлайка
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('Необходимо войти в систему');
      }

      if (userLike) {
        // Удаляем лайк
        const { error } = await supabase
          .from('listing_likes')
          .delete()
          .eq('listing_id', listingId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        return false;
      } else {
        // Добавляем лайк
        const { error } = await supabase
          .from('listing_likes')
          .insert({
            listing_id: listingId,
            user_id: user.id,
          });
        
        if (error) throw error;
        return true;
      }
    },
    onSuccess: (isLiked) => {
      // Обновляем кэш
      queryClient.invalidateQueries({ queryKey: ['listing-user-like', listingId] });
      queryClient.invalidateQueries({ queryKey: ['listing-likes-stats', listingId] });
      
      toast({
        title: isLiked ? 'Додано в обрані' : 'Видалено з обраних',
        description: isLiked ? 'Оголошення збережено в ваших обраних' : 'Оголошення видалено з обраних',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося оновити статус',
        variant: 'destructive',
      });
    },
  });

  return {
    isLiked: !!userLike,
    likesCount: likesStats || 0,
    toggleLike: toggleLikeMutation.mutate,
    isLoading: toggleLikeMutation.isPending,
  };
};