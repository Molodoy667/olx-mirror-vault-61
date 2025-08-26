import { Card } from '@/components/ui/card';
import { ReportDialogSimple } from './ReportDialogSimple';

interface ListingDetailsProps {
  listing: any;
}

export function ListingDetails({ listing }: ListingDetailsProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Додаткова інформація</h3>
        <ReportDialogSimple listingId={listing.id} />
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">ID оголошення:</span>
          <p className="font-medium">{listing.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Статус:</span>
          <p className="font-medium">
            {listing.status === 'active' ? 'Активне' : 'Неактивне'}
          </p>
        </div>
      </div>
    </Card>
  );
}