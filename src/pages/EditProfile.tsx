import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User, MapPin, Phone, Upload } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    location: '',
    phone: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Load existing profile data
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          username: data.username || '',
          location: data.location || '',
          phone: data.phone || '',
        });
        setAvatarUrl(data.avatar_url || '');
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Профіль оновлено!",
        description: "Ваші дані успішно збережено",
      });

      navigate(`/profile/${user.id}`);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити профіль",
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
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Редагувати профіль</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-primary hover:underline">
                    <Upload className="w-4 h-4" />
                    Змінити фото
                  </div>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG. Макс. 5MB
                </p>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="full_name">Повне ім'я</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Іван Іваненко"
              />
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username">Ім'я користувача</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="@username"
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Місцезнаходження</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Київ, Україна"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Телефон</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+380 XX XXX XX XX"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/profile/${user.id}`)}
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