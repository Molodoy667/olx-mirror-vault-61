import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  conversationId?: string;
  otherUserId: string;
  listingId?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  listing_id?: string;
  is_read: boolean;
  created_at: string;
}

export function ChatInterface({ conversationId, otherUserId, listingId }: ChatInterfaceProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId, otherUserId],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user && !!otherUserId,
  });

  const { data: otherUserProfile } = useQuery({
    queryKey: ['profile', otherUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, last_seen')
        .eq('id', otherUserId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!otherUserId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          content,
          listing_id: listingId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessage.isPending) return;
    
    sendMessage.mutate(newMessage.trim());
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getOnlineStatus = (lastSeen?: string) => {
    if (!lastSeen) return { text: 'Невідомо', color: 'text-gray-400', online: false };
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 5) {
      return { text: 'Онлайн', color: 'text-green-500', online: true };
    } else if (diffInMinutes < 60) {
      return { text: `${diffInMinutes} хв тому`, color: 'text-yellow-500', online: false };
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return { text: `${hours} год тому`, color: 'text-orange-500', online: false };
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return { text: `${days} д тому`, color: 'text-gray-500', online: false };
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Завантаження повідомлень...</div>
      </div>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <div className="relative">
          <GradientAvatar
            src={otherUserProfile?.avatar_url}
            username={otherUserProfile?.username || otherUserProfile?.full_name}
            size="md"
            onClick={() => navigate(`/profile/${otherUserId}`)}
          />
          {/* Online indicator */}
          {getOnlineStatus(otherUserProfile?.last_seen).online && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
          )}
        </div>
        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${otherUserId}`)}>
          <h3 className="font-semibold hover:text-primary transition-colors">
            {otherUserProfile?.full_name || 'Користувач'}
          </h3>
          <div className="flex items-center gap-1">
            <Circle className={`w-2 h-2 ${getOnlineStatus(otherUserProfile?.last_seen).online ? 'text-green-500' : 'text-gray-400'} fill-current`} />
            <span className={`text-xs ${getOnlineStatus(otherUserProfile?.last_seen).color}`}>
              {getOnlineStatus(otherUserProfile?.last_seen).text}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages?.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm md:max-w-md px-3 py-2 rounded-lg break-words overflow-hidden word-wrap break-all ${
                    isOwnMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm break-words whitespace-pre-wrap overflow-wrap-anywhere word-break-break-word">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: uk,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введіть повідомлення..."
            disabled={sendMessage.isPending}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sendMessage.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}