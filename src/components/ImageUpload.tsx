import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  images: string[];
  maxImages?: number;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({ 
  onImagesChange, 
  images, 
  maxImages = 8, 
  bucket = 'listings',
  folder = 'images'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const availableSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, availableSlots);

    if (filesToUpload.length === 0) {
      toast({
        title: "Досягнуто ліміт",
        description: `Максимум ${maxImages} зображень`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(uploadImage);
      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);
      
      toast({
        title: "Успішно",
        description: `${uploadedUrls.length} зображень завантажено`,
      });
    } catch (error: unknown) {
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося завантажити зображення",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    
    // Extract file path from URL to delete from storage
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts.slice(-3).join('/'); // folder/userId/filename
      
      await supabase.storage
        .from(bucket)
        .remove([fileName]);
    } catch (error) {
      console.error('Error deleting image from storage:', error);
    }
    
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
              disabled={uploading}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <label className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            )}
            <span className="text-xs text-muted-foreground text-center px-2">
              {uploading ? 'Завантаження...' : 'Додати фото'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Завантажено {images.length} з {maxImages} зображень
      </p>
    </div>
  );
}