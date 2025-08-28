import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Search, MessageCircle, Eye, Trash2, User, Clock, Package } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name?: string;
    username?: string;
  };
  receiver?: {
    full_name?: string;
    username?: string;
  };
  listings?: {
    title: string;
  };
}

export default function AdminMessages() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load related data
      const userIds = [...new Set([
        ...messagesData.map(m => m.sender_id),
        ...messagesData.map(m => m.receiver_id)
      ])].filter(Boolean);

      const listingIds = messagesData
        .map(m => m.listing_id)
        .filter(Boolean);

      const [usersResult, listingsResult] = await Promise.all([
        userIds.length > 0 ? supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds) : { data: [] },
        listingIds.length > 0 ? supabase
          .from('listings')
          .select('id, title')
          .in('id', listingIds) : { data: [] }
      ]);

      const usersMap = new Map((usersResult.data || []).map(user => [user.id, user]));
      const listingsMap = new Map((listingsResult.data || []).map(listing => [listing.id, listing]));

      const messagesWithRelations = messagesData.map(message => ({
        ...message,
        sender: usersMap.get(message.sender_id),
        receiver: usersMap.get(message.receiver_id),
        listings: message.listing_id ? listingsMap.get(message.listing_id) : undefined
      }));

      setMessages(messagesWithRelations);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити повідомлення",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це повідомлення?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: "Повідомлення видалено",
      });
      
      loadMessages();
      setShowDetailsDialog(false);
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити повідомлення",
        variant: "destructive",
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Менше години тому';
    if (diffInHours < 24) return `${diffInHours} год. тому`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} дн. тому`;
    return messageDate.toLocaleDateString('uk-UA');
  };

  const getUserName = (user: any) => {
    return user?.full_name || user?.username || 'Анонім';
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(message.sender).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(message.receiver).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.listings?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'read' && message.is_read) ||
      (statusFilter === 'unread' && !message.is_read);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: messages.length,
    unread: messages.filter(m => !m.is_read).length,
    withListing: messages.filter(m => m.listing_id).length,
    today: messages.filter(m => {
      const today = new Date().toDateString();
      return new Date(m.created_at).toDateString() === today;
    }).length
  };

  if (loading || loadingMessages) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Модерація повідомлень
            </h1>
            <p className="text-muted-foreground mt-1">Перегляд та управління повідомленнями користувачів</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Всього</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Непрочитані</p>
                    <p className="text-2xl font-bold">{stats.unread}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">З оголошеннями</p>
                    <p className="text-2xl font-bold">{stats.withListing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Сьогодні</p>
                    <p className="text-2xl font-bold">{stats.today}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Пошук повідомлень..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі повідомлення</SelectItem>
                    <SelectItem value="unread">Непрочитані</SelectItem>
                    <SelectItem value="read">Прочитані</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Messages Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Відправник</TableHead>
                    <TableHead>Отримувач</TableHead>
                    <TableHead>Оголошення</TableHead>
                    <TableHead>Повідомлення</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Час</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id} className={!message.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getUserName(message.sender)}</div>
                            <div className="text-xs text-muted-foreground">
                              {message.sender_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getUserName(message.receiver)}</div>
                            <div className="text-xs text-muted-foreground">
                              {message.receiver_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {message.listings?.title ? (
                          <Badge variant="outline" className="max-w-32 truncate">
                            {message.listings.title}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate text-sm">
                          {message.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={message.is_read ? 'secondary' : 'default'}>
                          {message.is_read ? 'Прочитано' : 'Непрочитано'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {getTimeAgo(message.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedMessage(message);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteMessage(message.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Message Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Деталі повідомлення</DialogTitle>
              </DialogHeader>
              
              {selectedMessage && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Відправник</h4>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getUserName(selectedMessage.sender)}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedMessage.sender_id}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Отримувач</h4>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getUserName(selectedMessage.receiver)}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedMessage.receiver_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedMessage.listings && (
                    <div>
                      <h4 className="font-medium mb-2">Оголошення</h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{selectedMessage.listings.title}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => navigate(`/${selectedMessage.listing_id}`)}
                        >
                          Переглянути оголошення
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Повідомлення</h4>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm">{selectedMessage.content}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Статус:</span> {selectedMessage.is_read ? 'Прочитано' : 'Непрочитано'}
                    </div>
                    <div>
                      <span className="font-medium">Час:</span> {new Date(selectedMessage.created_at).toLocaleString('uk-UA')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Видалити повідомлення
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}