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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Search, Plus, Edit, Trash2, FolderTree, Hash, Eye } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  name_uk: string;
  slug: string;
  icon?: string;
  color?: string;
  order_index?: number;
  parent_id?: string;
  created_at: string;
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_uk: '',
    slug: '',
    icon: '',
    color: '#0066cc',
    order_index: 0,
    parent_id: ''
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити категорії",
        variant: "destructive",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.name_uk || !formData.slug) {
      toast({
        title: "Помилка",
        description: "Заповніть всі обов'язкові поля",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editCategory.id);

        if (error) throw error;

        toast({
          title: "Успішно",
          description: "Категорію оновлено",
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Успішно",
          description: "Категорію створено",
        });
      }

      setShowDialog(false);
      setEditCategory(null);
      setFormData({
        name: '',
        name_uk: '',
        slug: '',
        icon: '',
        color: '#0066cc',
        order_index: 0,
        parent_id: ''
      });
      loadCategories();
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти категорію",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setFormData({
      name: category.name,
      name_uk: category.name_uk,
      slug: category.slug,
      icon: category.icon || '',
      color: category.color || '#0066cc',
      order_index: category.order_index || 0,
      parent_id: category.parent_id || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю категорію?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: "Категорію видалено",
      });
      
      loadCategories();
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити категорію",
        variant: "destructive",
      });
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name_uk.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || loadingCategories) {
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Управління категоріями
              </h1>
              <p className="text-muted-foreground mt-1">Всього категорій: {categories.length}</p>
            </div>
            
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Додати категорію
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editCategory ? 'Редагувати категорію' : 'Нова категорія'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Назва (англ.)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Electronics"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="name_uk">Назва (укр.)</Label>
                    <Input
                      id="name_uk"
                      value={formData.name_uk}
                      onChange={(e) => setFormData({...formData, name_uk: e.target.value})}
                      placeholder="Електроніка"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      placeholder="electronics"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icon">Іконка</Label>
                      <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        placeholder="Smartphone"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="color">Колір</Label>
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="order_index">Порядок</Label>
                      <Input
                        id="order_index"
                        type="number"
                        value={formData.order_index}
                        onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="parent_id">Батьківська категорія</Label>
                      <Select value={formData.parent_id} onValueChange={(value) => setFormData({...formData, parent_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Вибрати..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Без батьківської</SelectItem>
                          {categories.filter(cat => cat.id !== editCategory?.id).map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name_uk}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSubmit} className="flex-1">
                      {editCategory ? 'Оновити' : 'Створити'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                      Скасувати
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Пошук категорій..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Категорія</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Іконка</TableHead>
                    <TableHead>Колір</TableHead>
                    <TableHead>Порядок</TableHead>
                    <TableHead>Батьківська</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{category.name_uk}</div>
                          <div className="text-sm text-muted-foreground">{category.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.slug}</Badge>
                      </TableCell>
                      <TableCell>{category.icon || '—'}</TableCell>
                      <TableCell>
                        {category.color && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm">{category.color}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.order_index}</Badge>
                      </TableCell>
                      <TableCell>
                        {category.parent_id ? (
                          <Badge variant="outline">
                            <FolderTree className="w-3 h-3 mr-1" />
                            Підкатегорія
                          </Badge>
                        ) : (
                          <Badge>Основна</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(`/category/${category.slug}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
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
        </main>
      </div>
    </div>
  );
}