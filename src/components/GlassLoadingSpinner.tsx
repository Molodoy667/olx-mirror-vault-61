import { cn } from "@/lib/utils";

interface GlassLoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  showPulse?: boolean;
}

export function GlassLoadingSpinner({ 
  size = "md", 
  className,
  text = "Завантаження...",
  showPulse = true
}: GlassLoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 rounded-xl",
      "bg-white/5 backdrop-blur-md border border-white/10",
      "shadow-xl shadow-black/5",
      showPulse && "animate-pulse",
      className
    )}>
      {/* Glass morphism spinner */}
      <div className={cn(
        "relative rounded-full border-2 border-transparent",
        "bg-gradient-to-r from-primary/30 to-primary-dark/30",
        "backdrop-blur-sm mb-4",
        sizeClasses[size]
      )}>
        {/* Spinning border */}
        <div className={cn(
          "absolute inset-0 rounded-full",
          "border-2 border-transparent border-t-primary border-r-primary/50",
          "animate-spin"
        )} />
        
        {/* Inner glow */}
        <div className={cn(
          "absolute inset-1 rounded-full", 
          "bg-gradient-to-r from-primary/10 to-primary-dark/10",
          "backdrop-blur-sm"
        )} />
      </div>

      {/* Loading text with glass effect */}
      <div className={cn(
        "px-4 py-2 rounded-lg",
        "bg-white/5 backdrop-blur-sm border border-white/10",
        "shadow-lg shadow-black/5",
        textSizes[size]
      )}>
        <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent font-medium">
          {text}
        </span>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-1 bg-primary/30 rounded-full",
              "animate-bounce"
            )}
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 2) * 20}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + i * 0.3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Skeleton loading component with glass effect
export function GlassSkeletonCard({ className, ...props }: { className?: string }) {
  return (
    <div className={cn(
      "animate-pulse rounded-xl overflow-hidden",
      "bg-white/5 backdrop-blur-md border border-white/10",
      "shadow-xl shadow-black/5",
      className
    )} {...props}>
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-gradient-to-r from-muted/30 to-muted-foreground/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gradient-to-r from-muted/30 to-muted-foreground/10 rounded relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
        <div className="h-6 bg-gradient-to-r from-primary/20 to-primary-dark/20 rounded w-2/3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-gradient-to-r from-muted/30 to-muted-foreground/10 rounded w-1/3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
          <div className="h-3 bg-gradient-to-r from-muted/30 to-muted-foreground/10 rounded w-1/4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}