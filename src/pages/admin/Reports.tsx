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
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Search, Eye, CheckCircle, XCircle, AlertTriangle, User, Clock, MessageCircle } from 'lucide-react';

interface Report {
  id: string;
  listing_id: string;
  user_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
  resolved_at?: string;
  listings?: {
    title: string;
  };
  profiles?: {
    full_name?: string;
    username?: string;
  };
}

export default function AdminReports() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data: reportsData, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load related data
      const userIds = [...new Set(reportsData.map(r => r.user_id))].filter(Boolean);
      const listingIds = [...new Set(reportsData.map(r => r.listing_id))].filter(Boolean);

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

      const reportsWithRelations = reportsData.map(report => ({
        ...report,
        status: report.status as 'pending' | 'resolved' | 'rejected',
        profiles: usersMap.get(report.user_id),
        listings: listingsMap.get(report.listing_id)
      }));

      setReports(reportsWithRelations);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити скарги",
        variant: "destructive",
      });
    } finally {
      setLoadingReports(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: 'resolved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: `Скаргу ${status === 'resolved' ? 'вирішено' : 'відхилено'}`,
      });
      
      loadReports();
      setShowDetailsDialog(false);
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус скарги",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Очікує</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><CheckCircle className="w-3 h-3 mr-1" />Вирішено</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50"><XCircle className="w-3 h-3 mr-1" />Відхилено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'spam':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'fraud':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'inappropriate':
        return <Eye className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.listings?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (report.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesReason = reasonFilter === 'all' || report.reason === reasonFilter;
    return matchesSearch && matchesStatus && matchesReason;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    rejected: reports.filter(r => r.status === 'rejected').length
  };

  if (loading || loadingReports) {
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
              Управління скаргами
            </h1>
            <p className="text-muted-foreground mt-1">Модерація повідомлень користувачів</p>
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
                  <Clock className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Очікують</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Вирішено</p>
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Відхилено</p>
                    <p className="text-2xl font-bold">{stats.rejected}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Пошук скарг..."
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
                    <SelectItem value="all">Всі статуси</SelectItem>
                    <SelectItem value="pending">Очікують</SelectItem>
                    <SelectItem value="resolved">Вирішено</SelectItem>
                    <SelectItem value="rejected">Відхилено</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Причина" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі причини</SelectItem>
                    <SelectItem value="spam">Спам</SelectItem>
                    <SelectItem value="fraud">Шахрайство</SelectItem>
                    <SelectItem value="inappropriate">Неприйнятний контент</SelectItem>
                    <SelectItem value="other">Інше</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Оголошення</TableHead>
                    <TableHead>Автор скарги</TableHead>
                    <TableHead>Причина</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {report.listings?.title || 'Видалене оголошення'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {report.listing_id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {report.profiles?.full_name || report.profiles?.username || 'Анонім'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {report.user_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getReasonIcon(report.reason)}
                          <span className="capitalize">{report.reason}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString('uk-UA')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Деталі
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Report Details Dialog */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Деталі скарги</DialogTitle>
              </DialogHeader>
              
              {selectedReport && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Оголошення</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedReport.listings?.title || 'Видалене оголошення'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={async () => {
                        try {
                          const { getSeoUrl } = await import('@/lib/seo');
                          const seoUrl = await getSeoUrl(selectedReport.listing_id);
                          if (seoUrl) {
                            navigate(seoUrl);
                          } else {
                            navigate(`/listing/${selectedReport.listing_id}`);
                          }
                        } catch (error) {
                          navigate(`/listing/${selectedReport.listing_id}`);
                        }
                      }}
                    >
                      Переглянути оголошення
                    </Button>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Причина скарги</h4>
                    <div className="flex items-center gap-2">
                      {getReasonIcon(selectedReport.reason)}
                      <span className="capitalize">{selectedReport.reason}</span>
                    </div>
                  </div>
                  
                  {selectedReport.description && (
                    <div>
                      <h4 className="font-medium mb-2">Опис</h4>
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {selectedReport.description}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Статус</h4>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Дата створення</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedReport.created_at).toLocaleString('uk-UA')}
                    </p>
                  </div>
                  
                  {selectedReport.status === 'pending' && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Вирішити
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => updateReportStatus(selectedReport.id, 'rejected')}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Відхилити
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}