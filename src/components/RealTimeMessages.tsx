import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export function useRealTimeMessages() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate messages queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          // Show notification for new message
          toast({
            title: "Нове повідомлення",
            description: "Ви отримали нове повідомлення",
          });
        }
      )
      .subscribe();

    // Subscribe to message updates (mark as read)
    const messageUpdatesSubscription = supabase
      .channel('message_updates_channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    // Subscribe to notifications
    const notificationsSubscription = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          const notification = payload.new as any;
          toast({
            title: notification.title || "Нове сповіщення",
            description: notification.message,
          });
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      messageUpdatesSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [user, queryClient]);
}