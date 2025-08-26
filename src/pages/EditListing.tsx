import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, X, MapPin, DollarSign, Package, ArrowLeft } from 'lucide-react';
import { NovaPoshtaCityAutocomplete } from '@/components/NovaPoshtaCityAutocomplete';
import { KatottgCityAutocomplete } from '@/components/KatottgCityAutocomplete';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories } = useCategories();
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    price: '',
    currency: 'UAH',
    location: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Load existing listing data
    const loadListing = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити оголошення",
          variant: "destructive",
        });
        navigate('/my-listings');
        return;
      }

      setFormData({
        title: data.title || '',
        description: data.description || '',
        category_id: data.category_id || '',
        price: data.price?.toString() || '',
        currency: data.currency || 'UAH',
        location: data.location || '',
      });
      setImages(data.images || []);
    };

    loadListing();
  }, [id, user, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string].slice(0, 8));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.location || !formData.category_id) {
      toast({
        title: "Помилка",
        description: "Заповніть обов'язкові поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description || null,
          category_id: formData.category_id || null,
          price: formData.price ? Number(formData.price) : null,
          currency: formData.currency,
          location: formData.location,
          images: images.length > 0 ? images : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: "Успішно!",
        description: "Оголошення оновлено",
      });

      navigate('/my-listings');
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити оголошення",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/my-listings')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Редагувати оголошення</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Назва оголошення *</Label>
              <Input
                id="title"
                placeholder="Наприклад: iPhone 13 Pro Max"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.title.length}/100 символів
              </p>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Категорія *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name_uk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Images */}
            <div>
              <Label>Фотографії</Label>
              <div className="grid grid-cols-4 gap-4 mt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {images.length < 8 && (
                  <label className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Додати фото</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Максимум 8 фотографій
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Опис</Label>
              <Textarea
                id="description"
                placeholder="Детальний опис вашого товару або послуги"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                maxLength={2000}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.description.length}/2000 символів
              </p>
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Ціна</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="currency">Валюта</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UAH">UAH (₴)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Місцезнаходження *</Label>
              <KatottgCityAutocomplete
                value={formData.location}
                onChange={(value) => setFormData({ ...formData, location: value })}
                placeholder="Оберіть населений пункт..."
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/my-listings')}
                disabled={loading}
              >
                Скасувати
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Збереження...' : 'Зберегти зміни'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}