import { Card } from '@/components/ui/card';
import { SellerCard } from '@/components/SellerCard';
import { PriceHistory } from './PriceHistory';
import { SafetyTipsCard } from '@/components/SafetyTipsCard';
import { CreatePriceOfferDialog } from '@/components/CreatePriceOfferDialog';

interface ListingSidebarProps {
  listing: any;
  user: any;
  onContact: () => void;
}

export function ListingSidebar({ listing, user, onContact }: ListingSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Seller Card */}
      <SellerCard userId={listing.user_id} onContact={onContact} />

      {/* Price Offer */}
      {listing.price && listing.user_id !== user?.id && (
        <Card className="p-4">
          <CreatePriceOfferDialog
            listingId={listing.id}
            currentPrice={listing.price}
            sellerId={listing.user_id}
            listingTitle={listing.title}
            currency={listing.currency}
          />
        </Card>
      )}

      {/* Price History */}
      <PriceHistory 
        listingId={listing.id} 
        currentPrice={listing.price} 
        currency={listing.currency} 
      />

      {/* Safety Tips */}
      <SafetyTipsCard />
    </div>
  );
}