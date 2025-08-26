import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PriceOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'counter_offered';
  expires_at?: string;
  created_at: string;
  buyer_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  listing?: {
    title: string;
    price?: number;
    currency: string;
    images?: string[];
  };
}

export const usePriceOffers = (listingId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['price-offers', listingId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('price_offers')
        .select('*');

      if (listingId) {
        query = query.eq('listing_id', listingId);
      } else {
        // Get offers for user's listings or offers made by user
        query = query.or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreatePriceOffer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      listingId,
      sellerId,
      offeredPrice,
      message,
      expiresAt,
    }: {
      listingId: string;
      sellerId: string;
      offeredPrice: number;
      message?: string;
      expiresAt?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('price_offers')
        .insert({
          listing_id: listingId,
          seller_id: sellerId,
          buyer_id: user.id,
          offered_price: offeredPrice,
          message,
          expires_at: expiresAt,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-offers', variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ['price-offers'] });
    },
  });
};

export const useUpdatePriceOfferStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      offerId,
      status,
    }: {
      offerId: string;
      status: 'accepted' | 'rejected' | 'counter_offered';
    }) => {
      const { data, error } = await supabase
        .from('price_offers')
        .update({ status })
        .eq('id', offerId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-offers'] });
    },
  });
};