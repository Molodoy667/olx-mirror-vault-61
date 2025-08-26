import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  listing_id?: string;
  last_message_at: string;
  created_at: string;
  participant1_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  participant2_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  listing?: {
    title: string;
    images?: string[];
  };
  latest_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
}

export const useConversations = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      otherUserId, 
      listingId 
    }: { 
      otherUserId: string; 
      listingId?: string; 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('conversations')
        .upsert({
          participant1_id: user.id,
          participant2_id: otherUserId,
          listing_id: listingId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};