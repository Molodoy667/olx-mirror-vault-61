import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { toast } from '@/hooks/use-toast';
import { Send, ArrowLeft, User, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useRealTimeMessages } from '@/components/RealTimeMessages';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  listing_id?: string;
  listings?: {
    id: string;
    title: string;
  };
  sender?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  receiver?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface Chat {
  user_id: string;
  user_name: string;
  username?: string;
  avatar_url?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  last_seen?: string;
}

export default function Messages() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(userId || null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enable real-time updates
  useRealTimeMessages();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    loadChats();
    if (selectedChat) {
      loadMessages(selectedChat);
      markAsRead(selectedChat);
    }
  }, [selectedChat, user, navigate]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Update user's last_seen when component mounts
  useEffect(() => {
    if (user) {
      updateLastSeen();
    }
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profiles:profiles!messages_sender_id_fkey(id, full_name, username, avatar_url, last_seen),
          receiver_profiles:profiles!messages_receiver_id_fkey(id, full_name, username, avatar_url, last_seen),
          listings(id, title)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by chat
      const chatMap = new Map<string, Chat>();
      
      messagesData?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === user.id ? msg.receiver_profiles : msg.sender_profiles;
        
        if (!chatMap.has(otherUserId)) {
          chatMap.set(otherUserId, {
            user_id: otherUserId,
            user_name: otherUser?.full_name || otherUser?.username || 'Користувач',
            username: otherUser?.username,
            avatar_url: otherUser?.avatar_url,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: !msg.is_read && msg.receiver_id === user.id ? 1 : 0,
            last_seen: otherUser?.last_seen,
          });
        } else {
          const chat = chatMap.get(otherUserId)!;
          if (!msg.is_read && msg.receiver_id === user.id) {
            chat.unread_count++;
          }
        }
      });

      setChats(Array.from(chatMap.values()));
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, listings(id, title)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async (otherUserId: string) => {
    if (!user) return;
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id);
  };

  const updateLastSeen = async () => {
    if (!user) return;
    
    try {
      await supabase.rpc('update_user_last_seen', { user_id: user.id });
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedChat,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedChat);
      loadChats();
      updateLastSeen(); // Update last seen when sending message
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося відправити повідомлення",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="bg-card rounded-lg shadow-lg h-[600px] md:h-[700px] flex flex-col md:flex-row">
          {/* Chat List */}
          <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} md:w-1/3 border-b md:border-b-0 md:border-r flex-col`}>
            <div className="p-3 md:p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Повідомлення</h2>
              {selectedChat && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
            <ScrollArea className="h-[530px]">
              {chats.length > 0 ? (
                chats.map((chat) => (
                  <div
                    key={chat.user_id}
                    onClick={() => setSelectedChat(chat.user_id)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                      selectedChat === chat.user_id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <GradientAvatar
                          src={chat.avatar_url}
                          username={chat.user_name}
                          size="md"
                        />
                        {/* Online indicator */}
                        {getOnlineStatus(chat.last_seen).online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{chat.user_name}</p>
                          {chat.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Circle className={`w-2 h-2 ${getOnlineStatus(chat.last_seen).online ? 'text-green-500' : 'text-gray-400'} fill-current`} />
                          <span className={`text-xs ${getOnlineStatus(chat.last_seen).color}`}>
                            {getOnlineStatus(chat.last_seen).text}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.last_message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(chat.last_message_time), {
                            addSuffix: true,
                            locale: uk,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  У вас поки немає повідомлень
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-3 md:p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedChat(null)}
                    className="md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  
                  <div className="relative">
                    <GradientAvatar
                      src={chats.find(c => c.user_id === selectedChat)?.avatar_url}
                      username={chats.find(c => c.user_id === selectedChat)?.user_name}
                      size="md"
                      onClick={async () => {
                        try {
                          const profileUrl = await import('@/lib/profileUtils').then(m => m.getProfileUrlForUser(selectedChat));
                          navigate(profileUrl);
                        } catch (error) {
                          navigate(`/profile/${selectedChat}`);
                        }
                      }}
                    />
                    {/* Online indicator in header */}
                    {(() => {
                      const currentChat = chats.find(c => c.user_id === selectedChat);
                      const status = getOnlineStatus(currentChat?.last_seen);
                      return status.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                      );
                    })()}
                  </div>
                  
                  <div className="flex-1 cursor-pointer" onClick={async () => {
                    try {
                      const profileUrl = await import('@/lib/profileUtils').then(m => m.getProfileUrlForUser(selectedChat));
                      navigate(profileUrl);
                    } catch (error) {
                      navigate(`/profile/${selectedChat}`);
                    }
                  }}>
                    <p className="font-medium hover:text-primary transition-colors">
                      {chats.find(c => c.user_id === selectedChat)?.user_name || 'Користувач'}
                    </p>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const currentChat = chats.find(c => c.user_id === selectedChat);
                        const status = getOnlineStatus(currentChat?.last_seen);
                        return (
                          <>
                            <Circle className={`w-2 h-2 ${status.online ? 'text-green-500' : 'text-gray-400'} fill-current`} />
                            <span className={`text-xs ${status.color}`}>
                              {status.text}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id}>
                        {message.listings && (
                          <div className="flex justify-center mb-4">
                            <div 
                              onClick={async () => {
                                try {
                                  const { getOrCreateSeoUrl } = await import('@/lib/seo');
                                  const seoUrl = await getOrCreateSeoUrl(message.listings.id, message.listings.title);
                                  navigate(seoUrl);
                                } catch (error) {
                                  navigate(`/listing/${message.listings.id}`);
                                }
                              }}
                              className="bg-muted/50 px-4 py-2 rounded-lg text-sm text-muted-foreground cursor-pointer hover:bg-muted"
                            >
                              Оголошення: {message.listings.title}
                            </div>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            message.sender_id === user.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg rounded-lg p-3 break-words overflow-hidden word-wrap break-all ${
                              message.sender_id === user.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap overflow-wrap-anywhere word-break-break-word">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: uk,
                            })}
                          </p>
                        </div>
                        </div>
                      </div>
                    ))}
                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-3 md:p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Напишіть повідомлення..."
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={loading || !newMessage.trim()}
                      size="icon"
                      className="flex-shrink-0"
                    >
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Виберіть чат для початку спілкування
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}