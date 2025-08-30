import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { toast } from '@/hooks/use-toast';
import { Send, ArrowLeft, User, Circle, ShoppingCart, DollarSign, MessageCircle, Clock } from 'lucide-react';
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
  message_type?: 'buying' | 'selling';
  listings?: {
    id: string;
    title: string;
    price?: number;
  };
  sender?: {
    full_name?: string;
    avatar_url?: string;
    last_seen?: string;
    is_online?: boolean;
  };
  receiver?: {
    full_name?: string;
    avatar_url?: string;
    last_seen?: string;
    is_online?: boolean;
  };
}

interface Conversation {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
  last_seen?: string;
  message_type: 'buying' | 'selling';
  listing_title?: string;
  listing_price?: number;
}

export function MessagesImproved() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Используем real-time обновления
  useRealTimeMessages(chatId || '', (newMessage) => {
    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  });

  // Загрузка списка собеседников
  const loadConversations = async () => {
    if (!user) return;

    try {
      // Получаем все уникальные беседы пользователя
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read,
          listing_id,
          listings (
            id,
            title,
            price,
            user_id
          ),
          sender:sender_id (
            id,
            full_name,
            avatar_url,
            last_seen,
            is_online
          ),
          receiver:receiver_id (
            id,
            full_name,
            avatar_url,
            last_seen,
            is_online
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Группируем сообщения по собеседникам
      const conversationsMap = new Map<string, Conversation>();

      messagesData?.forEach((message: any) => {
        const isFromMe = message.sender_id === user.id;
        const otherUserId = isFromMe ? message.receiver_id : message.sender_id;
        const otherUser = isFromMe ? message.receiver : message.sender;
        
        // Определяем тип сообщения (покупка/продажа)
        let messageType: 'buying' | 'selling' = 'buying';
        if (message.listing_id && message.listings) {
          // Если объявление принадлежит текущему пользователю - это продажа
          // Если объявление принадлежит другому пользователю - это покупка
          messageType = message.listings.user_id === user.id ? 'selling' : 'buying';
        }

        const existingConv = conversationsMap.get(otherUserId);
        
        if (!existingConv || new Date(message.created_at) > new Date(existingConv.last_message_time)) {
          conversationsMap.set(otherUserId, {
            user_id: otherUserId,
            user_name: otherUser?.full_name || 'Користувач',
            user_avatar: otherUser?.avatar_url,
            last_message: message.content,
            last_message_time: message.created_at,
            unread_count: isFromMe ? 0 : (message.is_read ? 0 : 1),
            is_online: otherUser?.is_online || false,
            last_seen: otherUser?.last_seen,
            message_type: messageType,
            listing_title: message.listings?.title,
            listing_price: message.listings?.price
          });
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити повідомлення",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка сообщений конкретного чата
  const loadChatMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          is_read,
          listing_id,
          listings (
            id,
            title,
            price
          ),
          sender:sender_id (
            full_name,
            avatar_url,
            is_online,
            last_seen
          )
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Отмечаем сообщения как прочитанные
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id);

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: chatId,
          content: newMessage.trim(),
          is_read: false
        });

      if (error) throw error;

      setNewMessage('');
      
      // Перезагружаем сообщения
      await loadChatMessages(chatId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося відправити повідомлення",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getOnlineStatus = (isOnline: boolean, lastSeen?: string) => {
    if (isOnline) {
      return { text: 'онлайн', color: 'text-green-500', dot: 'bg-green-500' };
    }
    
    if (lastSeen) {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
      
      if (diffMinutes < 5) {
        return { text: 'був нещодавно', color: 'text-orange-500', dot: 'bg-orange-500' };
      } else if (diffMinutes < 60) {
        return { text: `був ${diffMinutes} хв тому`, color: 'text-gray-500', dot: 'bg-gray-400' };
      } else {
        return { text: formatDistanceToNow(lastSeenDate, { addSuffix: true, locale: uk }), color: 'text-gray-500', dot: 'bg-gray-400' };
      }
    }
    
    return { text: 'був давно', color: 'text-gray-400', dot: 'bg-gray-300' };
  };

  const filteredConversations = conversations.filter(conv => conv.message_type === activeTab);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (chatId) {
      loadChatMessages(chatId);
    }
  }, [chatId, user]);

  // Если выбран конкретный чат
  if (chatId) {
    const currentConversation = conversations.find(c => c.user_id === chatId);
    const status = currentConversation ? getOnlineStatus(currentConversation.is_online, currentConversation.last_seen) : null;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Заголовок чата */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-lg border">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/messages')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                onClick={() => navigate(`/profile/${chatId}`)}
              >
                <div className="relative">
                  <GradientAvatar 
                    name={currentConversation?.user_name || 'User'} 
                    size="md"
                    src={currentConversation?.user_avatar}
                  />
                  {status && (
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${status.dot} rounded-full border-2 border-background`} />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold">{currentConversation?.user_name || 'Користувач'}</h2>
                  {status && (
                    <p className={`text-xs ${status.color}`}>{status.text}</p>
                  )}
                </div>
              </div>
              
              {currentConversation?.listing_title && (
                <div className="text-right">
                  <p className="text-sm font-medium">{currentConversation.listing_title}</p>
                  {currentConversation.listing_price && (
                    <p className="text-xs text-muted-foreground">{currentConversation.listing_price} UAH</p>
                  )}
                </div>
              )}
            </div>

            {/* Контейнер сообщений с прокруткой */}
            <div className="bg-card rounded-lg border mb-6 flex flex-col h-[500px]">
              {/* Сообщения */}
              <ScrollArea className="flex-1 p-4" ref={messagesContainerRef}>
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isFromMe = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isFromMe ? 'order-2' : 'order-1'}`}>
                          {!isFromMe && (
                            <div className="flex items-center gap-2 mb-1">
                              <GradientAvatar 
                                name={message.sender?.full_name || 'User'} 
                                size="sm"
                                src={message.sender?.avatar_url}
                              />
                              <span className="text-xs text-muted-foreground">
                                {message.sender?.full_name || 'Користувач'}
                              </span>
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-2xl ${
                              isFromMe
                                ? 'bg-primary text-primary-foreground ml-auto'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(new Date(message.created_at), { 
                                addSuffix: true, 
                                locale: uk 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Поле ввода */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишіть повідомлення..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Главная страница сообщений со списком собеседников
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="flex items-center gap-4 mb-6">
            <MessageCircle className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Повідомлення</h1>
              <p className="text-muted-foreground">Ваші розмови з покупцями та продавцями</p>
            </div>
          </div>

          {/* Вкладки Покупка/Продажа */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'buying' | 'selling')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="buying" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Купівля
                {conversations.filter(c => c.message_type === 'buying').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {conversations.filter(c => c.message_type === 'buying').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="selling" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Продаж
                {conversations.filter(c => c.message_type === 'selling').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {conversations.filter(c => c.message_type === 'selling').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Содержимое вкладок */}
            <TabsContent value="buying" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                💰 Розмови де ви хочете щось купити
              </div>
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Немає розмов про покупки</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <ConversationCard 
                      key={conversation.user_id} 
                      conversation={conversation} 
                      onClick={() => navigate(`/messages/${conversation.user_id}`)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="selling" className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                🏪 Розмови де хочуть купити у вас
              </div>
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Немає розмов про продаж</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <ConversationCard 
                      key={conversation.user_id} 
                      conversation={conversation} 
                      onClick={() => navigate(`/messages/${conversation.user_id}`)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Компонент карточки собеседника (как в Telegram)
function ConversationCard({ conversation, onClick }: { conversation: Conversation; onClick: () => void }) {
  const status = getOnlineStatus(conversation.is_online, conversation.last_seen);
  
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-card rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
    >
      {/* Аватар с индикатором онлайн */}
      <div className="relative">
        <GradientAvatar 
          name={conversation.user_name} 
          size="md"
          src={conversation.user_avatar}
        />
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${status.dot} rounded-full border-2 border-background`} />
      </div>

      {/* Информация о собеседнике */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold truncate">{conversation.user_name}</h3>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.last_message_time), { 
              addSuffix: true, 
              locale: uk 
            })}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground truncate mb-1">
          {conversation.last_message}
        </p>
        
        <div className="flex items-center justify-between">
          <span className={`text-xs ${status.color} flex items-center gap-1`}>
            <Circle className={`w-2 h-2 ${status.dot}`} />
            {status.text}
          </span>
          
          {conversation.unread_count > 0 && (
            <Badge variant="default" className="bg-primary text-primary-foreground">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
        
        {/* Информация об объявлении */}
        {conversation.listing_title && (
          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
            <p className="font-medium truncate">{conversation.listing_title}</p>
            {conversation.listing_price && (
              <p className="text-muted-foreground">{conversation.listing_price} UAH</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getOnlineStatus(isOnline: boolean, lastSeen?: string) {
  if (isOnline) {
    return { text: 'онлайн', color: 'text-green-500', dot: 'bg-green-500' };
  }
  
  if (lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) {
      return { text: 'був нещодавно', color: 'text-orange-500', dot: 'bg-orange-500' };
    } else if (diffMinutes < 60) {
      return { text: `був ${diffMinutes} хв тому`, color: 'text-gray-500', dot: 'bg-gray-400' };
    } else {
      return { text: formatDistanceToNow(lastSeenDate, { addSuffix: true, locale: uk }), color: 'text-gray-500', dot: 'bg-gray-400' };
    }
  }
  
  return { text: 'був давно', color: 'text-gray-400', dot: 'bg-gray-300' };
}