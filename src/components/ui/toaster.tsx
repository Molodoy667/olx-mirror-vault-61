import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

const TOAST_DURATION = 3000; // 3 секунды

function ToastWithProgress({ id, title, description, action, variant, ...props }: any) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
      case 'destructive':
        return <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getProgressColor = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500';
      case 'destructive':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <Toast variant={variant} {...props}>
      <div className="flex items-start gap-3 w-full">
        {getIcon()}
        <div className="grid gap-1 flex-1 min-w-0">
          {title && (
            <ToastTitle className="text-sm font-semibold leading-tight">
              {title}
            </ToastTitle>
          )}
          {description && (
            <ToastDescription className="text-sm opacity-90 leading-relaxed">
              {description}
            </ToastDescription>
          )}
        </div>
        <ToastClose className="flex-shrink-0" />
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 overflow-hidden rounded-b-lg">
        <div 
          className={`h-full transition-all duration-75 ease-linear ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {action}
    </Toast>
  );
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <ToastWithProgress 
            key={id} 
            id={id}
            title={title}
            description={description}
            action={action}
            {...props}
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
