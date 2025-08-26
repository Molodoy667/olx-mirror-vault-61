import { Badge } from "@/components/ui/badge";
import { Store, Verified, Star } from "lucide-react";

interface BusinessProfileBadgeProps {
  isBusiness?: boolean;
  isVerified?: boolean;
  rating?: number;
  size?: "sm" | "md" | "lg";
}

export function BusinessProfileBadge({ 
  isBusiness = false, 
  isVerified = false, 
  rating,
  size = "sm" 
}: BusinessProfileBadgeProps) {
  if (!isBusiness && !isVerified) return null;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5", 
    lg: "text-base px-4 py-2"
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className="flex items-center gap-1">
      {isBusiness && (
        <Badge 
          variant="secondary" 
          className={`bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ${sizeClasses[size]} flex items-center gap-1`}
        >
          <Store className={iconSize[size]} />
          {size !== "sm" && "Бізнес"}
        </Badge>
      )}
      
      {isVerified && (
        <Badge 
          variant="secondary"
          className={`bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ${sizeClasses[size]} flex items-center gap-1`}
        >
          <Verified className={iconSize[size]} />
          {size !== "sm" && "Перевірено"}
        </Badge>
      )}

      {rating && rating > 0 && (
        <Badge 
          variant="secondary"
          className={`bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ${sizeClasses[size]} flex items-center gap-1`}
        >
          <Star className={`${iconSize[size]} fill-current`} />
          {size !== "sm" && rating.toFixed(1)}
        </Badge>
      )}
    </div>
  );
}