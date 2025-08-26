import { Card } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

interface ListingDescriptionProps {
  description?: string;
}

export function ListingDescription({ description }: ListingDescriptionProps) {
  if (!description) return null;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        Опис товару
      </h2>
      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
        {description}
      </p>
    </Card>
  );
}