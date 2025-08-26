import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MapPin, DollarSign, Package } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { NovaPoshtaCityAutocomplete } from '@/components/NovaPoshtaCityAutocomplete';
import { KatottgCityAutocomplete } from '@/components/KatottgCityAutocomplete';

export default function CreateListing() {
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

  if (!user) {
    navigate('/auth');
    return null;
  }


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
      const { data, error } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          category_id: formData.category_id || null,
          price: formData.price ? Number(formData.price) : null,
          currency: formData.currency,
          location: formData.location,
          images: images.length > 0 ? images : null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Успішно!",
        description: "Оголошення створено",
      });

      navigate(`/listing/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити оголошення",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-card rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Створити оголошення</h1>
          
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
              <ImageUpload 
                images={images}
                onImagesChange={setImages}
                maxImages={8}
                bucket="listings"
                folder="images"
              />
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
                showRegionsOnEmpty={true}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Скасувати
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Створення...' : 'Опублікувати оголошення'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}