import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Shield,
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Flag,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

interface PendingListing {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  location: string;
  images?: string[];
  created_at: string;
  user_id: string;
  status: string;
  category?: {
    name_uk: string;
  };
  profiles?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface Report {
  id: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  user_id: string;
  listing_id: string;
  listings?: {
    title: string;
    user_id: string;
  };
  profiles?: {
    full_name?: string;
    username?: string;
  };
}

export default function AdminModeration() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  
  // Стан для оголошень на модерації
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  
  // Стан для скарг
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  
  // Фільтри
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedListing, setSelectedListing] = useState<PendingListing | null>(null);
  const [moderationNote, setModerationNote] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadPendingListings();
    loadReports();
  }, []);

  // Завантаження оголошень на модерації
  const loadPendingListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingListings(data || []);
    } catch (error) {
      console.error('Помилка завантаження оголошень:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити оголошення на модерації",
        variant: "destructive",
      });
    } finally {
      setLoadingListings(false);
    }
  };

  // Завантаження скарг
  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Помилка завантаження скарг:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити скарги",
        variant: "destructive",
      });
    } finally {
      setLoadingReports(false);
    }
  };

  // Схвалення оголошення
  const approveListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'active',
          // Можна додати поле moderated_by та moderated_at
        })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: "Оголошення схвалено та опубліковано",
      });
      
      loadPendingListings();
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося схвалити оголошення",
        variant: "destructive",
      });
    }
  };

  // Відхилення оголошення
  const rejectListing = async (listingId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'rejected',
          // Можна додати поле rejection_reason
        })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: "Оголошення відхилено",
      });
      
      loadPendingListings();
      setSelectedListing(null);
      setModerationNote('');
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося відхилити оголошення",
        variant: "destructive",
      });
    }
  };

  // Обробка скарги
  const resolveReport = async (reportId: string, action: 'approved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status: action === 'approved' ? 'resolved' : 'dismissed',
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: `Скаргу ${action === 'approved' ? 'підтверджено' : 'відхилено'}`,
      });
      
      loadReports();
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося обробити скаргу",
        variant: "destructive",
      });
    }
  };

  // Фільтрація оголошень
  const filteredListings = pendingListings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Фільтрація скарг
  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.listings?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading || loadingListings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
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
              Модерація контенту
            </h1>
            <p className="text-muted-foreground mt-1">
              Управління оголошеннями та скаргами користувачів
            </p>
          </div>

          {/* Статистика модерації */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">На модерації</p>
                    <p className="text-2xl font-bold">{pendingListings.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Активні скарги</p>
                    <p className="text-2xl font-bold">
                      {reports.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20">
                    <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Вирішено сьогодні</p>
                    <p className="text-2xl font-bold">
                      {reports.filter(r => 
                        r.resolved_at && 
                        new Date(r.resolved_at).toDateString() === new Date().toDateString()
                      ).length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Середній час обробки</p>
                    <p className="text-2xl font-bold">2.5г</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Фільтри пошуку */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Пошук оголошень або скарг..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Вкладки модерації */}
          <Tabs defaultValue="listings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
              <TabsTrigger value="listings" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Оголошення на модерації
                {pendingListings.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingListings.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Скарги користувачів
                {reports.filter(r => r.status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {reports.filter(r => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Оголошення на модерації */}
            <TabsContent value="listings" className="space-y-4">
              {filteredListings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Немає оголошень на модерації</h3>
                    <p className="text-muted-foreground">
                      Всі оголошення модеровані або автоматичне схвалення увімкнено
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredListings.map((listing) => (
                    <Card key={listing.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Зображення оголошення */}
                        {listing.images && listing.images.length > 0 && (
                          <div className="relative h-48 bg-muted">
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {listing.images.length > 1 && (
                              <Badge className="absolute top-2 right-2">
                                +{listing.images.length - 1} фото
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="p-4 space-y-4">
                          {/* Заголовок та ціна */}
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>{listing.location}</span>
                              {listing.price && (
                                <span className="font-medium text-foreground">
                                  {listing.price.toLocaleString('uk-UA')} {listing.currency}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Інформація про автора */}
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={listing.profiles?.avatar_url} />
                              <AvatarFallback>
                                {(listing.profiles?.full_name || listing.profiles?.username || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {listing.profiles?.full_name || listing.profiles?.username || 'Анонімний користувач'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(listing.created_at), { 
                                  addSuffix: true, 
                                  locale: uk 
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Опис (скорочено) */}
                          {listing.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {listing.description}
                            </p>
                          )}

                          {/* Дії модератора */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            <Button
                              onClick={() => approveListing(listing.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Схвалити
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  size="sm"
                                  onClick={() => setSelectedListing(listing)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Відхилити
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Відхилення оголошення</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground">
                                    Ви відхиляєте оголошення: "{selectedListing?.title}"
                                  </p>
                                  <Textarea
                                    placeholder="Причина відхилення (необов'язково)"
                                    value={moderationNote}
                                    onChange={(e) => setModerationNote(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      variant="destructive"
                                      onClick={() => rejectListing(listing.id, moderationNote)}
                                      className="flex-1"
                                    >
                                      Підтвердити відхилення
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/listing/${listing.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Скарги користувачів */}
            <TabsContent value="reports" className="space-y-4">
              <div className="mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Статус скарги" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі скарги</SelectItem>
                    <SelectItem value="pending">Очікують обробки</SelectItem>
                    <SelectItem value="resolved">Вирішені</SelectItem>
                    <SelectItem value="dismissed">Відхилені</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredReports.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Flag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Немає скарг</h3>
                    <p className="text-muted-foreground">
                      Скарги від користувачів будуть відображатися тут
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  report.status === 'pending' ? 'destructive' :
                                  report.status === 'resolved' ? 'default' : 'secondary'
                                }
                              >
                                {report.status === 'pending' ? 'Очікує' :
                                 report.status === 'resolved' ? 'Вирішено' : 'Відхилено'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(report.created_at), { 
                                  addSuffix: true, 
                                  locale: uk 
                                })}
                              </span>
                            </div>
                            
                            <div>
                              <h4 className="font-medium">
                                Скарга на: {report.listings?.title || 'Видалене оголошення'}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Причина: {report.reason}
                              </p>
                              {report.description && (
                                <p className="text-sm mt-2">{report.description}</p>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Від: {report.profiles?.full_name || report.profiles?.username || 'Анонім'}
                            </div>
                          </div>

                          {report.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => resolveReport(report.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveReport(report.id, 'dismissed')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/listing/${report.listing_id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}