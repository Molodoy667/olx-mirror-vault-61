import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserRating {
  id: string;
  rated_user_id: string;
  rater_user_id: string;
  rating: number;
  comment?: string;
  transaction_id?: string;
  created_at: string;
  rater_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const useUserRatings = (userId: string) => {
  return useQuery({
    queryKey: ['user-ratings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('*')
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useUserRatingStats = (userId: string) => {
  return useQuery({
    queryKey: ['user-rating-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', userId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          averageRating: 0,
          totalRatings: 0,
          distribution: [0, 0, 0, 0, 0],
        };
      }

      const ratings = data.map(r => r.rating);
      const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const totalRatings = ratings.length;
      
      const distribution = [1, 2, 3, 4, 5].map(
        rating => ratings.filter(r => r === rating).length
      );

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        distribution,
      };
    },
    enabled: !!userId,
  });
};

export const useCreateUserRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      ratedUserId,
      rating,
      comment,
      transactionId,
    }: {
      ratedUserId: string;
      rating: number;
      comment?: string;
      transactionId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('user_ratings')
        .insert({
          rated_user_id: ratedUserId,
          rater_user_id: user.id,
          rating,
          comment,
          transaction_id: transactionId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-ratings', variables.ratedUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-rating-stats', variables.ratedUserId] });
    },
  });
};