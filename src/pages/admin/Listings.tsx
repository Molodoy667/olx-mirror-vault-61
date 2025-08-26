import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Search, Eye, EyeOff, Trash2, Package, MapPin } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  location: string;
  status: string;
  is_promoted: boolean;
  views: number;
  created_at: string;
  user_id: string;
  categories?: {
    name_uk: string;
  };
}

export default function AdminListings() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          categories:category_id(name_uk)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити оголошення",
        variant: "destructive",
      });
    } finally {
      setLoadingListings(false);
    }
  };

  const toggleStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: `Оголошення ${newStatus === 'active' ? 'активоване' : 'деактивоване'}`,
      });
      
      loadListings();
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити статус",
        variant: "destructive",
      });
    }
  };

  const togglePromotion = async (listingId: string, currentPromoted: boolean) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_promoted: !currentPromoted })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: currentPromoted ? "Промо знято" : "Оголошення промо",
      });
      
      loadListings();
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити промо статус",
        variant: "destructive",
      });
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це оголошення?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: "Оголошення видалено",
      });
      
      loadListings();
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити оголошення",
        variant: "destructive",
      });
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading || loadingListings) {
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
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Управління оголошеннями
            </h1>
            <p className="text-muted-foreground mt-1">Всього оголошень: {listings.length}</p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Пошук оголошень..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Фільтр за статусом" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  <SelectItem value="active">Активні</SelectItem>
                  <SelectItem value="inactive">Неактивні</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Listings Table */}
          <div className="bg-card rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Оголошення</TableHead>
                  <TableHead>Категорія</TableHead>
                  <TableHead>Автор</TableHead>
                  <TableHead>Ціна</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Промо</TableHead>
                  <TableHead>Перегляди</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{listing.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {listing.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {listing.categories?.name_uk || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ID: {listing.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {listing.price ? 
                        `${listing.price.toLocaleString('uk-UA')} ${listing.currency}` : 
                        'Безкоштовно'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                        {listing.status === 'active' ? 'Активне' : 'Неактивне'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={listing.is_promoted ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePromotion(listing.id, listing.is_promoted)}
                      >
                        {listing.is_promoted ? 'Промо' : 'Звичайне'}
                      </Button>
                    </TableCell>
                    <TableCell>{listing.views}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/listing/${listing.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleStatus(listing.id, listing.status)}
                        >
                          {listing.status === 'active' ? 
                            <EyeOff className="w-4 h-4" /> : 
                            <Eye className="w-4 h-4" />
                          }
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteListing(listing.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  );
}