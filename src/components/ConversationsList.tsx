import { useConversations } from '@/hooks/useConversations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface ConversationsListProps {
  onSelectConversation: (conversationId: string, otherUserId: string) => void;
}

export function ConversationsList({ onSelectConversation }: ConversationsListProps) {
  const { data: conversations, isLoading } = useConversations();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Немає активних розмов</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const isCurrentUserParticipant1 = user?.id === conversation.participant1_id;
        const otherUserId = isCurrentUserParticipant1 
          ? conversation.participant2_id 
          : conversation.participant1_id;

        return (
          <Card
            key={conversation.id}
            className="p-4 hover:bg-accent cursor-pointer transition-colors"
            onClick={() => onSelectConversation(conversation.id, otherUserId)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    Користувач {otherUserId.slice(0, 8)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.last_message_at), {
                      addSuffix: true,
                      locale: uk,
                    })}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground truncate">
                  Останнє повідомлення: {formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: true,
                    locale: uk,
                  })}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}