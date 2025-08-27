import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { 
  Home, 
  Search, 
  Plus, 
  Heart, 
  MessageCircle, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserProfileUrl } from "@/utils/userUtils";

export function UserBottomPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Додаємо padding-bottom до body для мобільних пристроїв
  useEffect(() => {
    if (user && window.innerWidth < 768) { // md breakpoint
      document.body.style.paddingBottom = 'calc(80px + env(safe-area-inset-bottom, 0px))';
    }
    
    return () => {
      document.body.style.paddingBottom = '';
    };
  }, [user]);

  // Не показуємо панель для неавторизованих користувачів
  if (!user) {
    return null;
  }

  const menuItems = [
    {
      icon: Home,
      label: 'Головна',
      path: '/',
      color: 'text-primary'
    },
    {
      icon: Search,
      label: 'Пошук',
      path: '/search',
      color: 'text-blue-500'
    },
    {
      icon: Plus,
      label: 'Додати',
      path: '/create',
      color: 'text-green-500',
      highlight: true
    },
    {
      icon: Heart,
      label: 'Обрані',
      path: '/favorites',
      color: 'text-red-500'
    },
    {
      icon: MessageCircle,
      label: 'Чат',
      path: '/messages',
      color: 'text-purple-500'
    },
    {
      icon: User,
      label: 'Профіль',
      path: getUserProfileUrl(user),
      color: 'text-orange-500'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 bottom-panel-shadow">
      <div className="flex items-center justify-around py-3 px-4">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              "flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
              "active:scale-95 touch-manipulation",
              isActive(item.path) 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "relative",
              item.highlight && "bg-gradient-to-r from-primary to-primary-dark p-2 rounded-full"
            )}>
              <item.icon className={cn(
                "w-5 h-5",
                item.highlight ? "text-white" : isActive(item.path) ? "text-primary" : item.color
              )} />
            </div>
            <span className={cn(
              "text-xs font-medium truncate max-w-full",
              isActive(item.path) ? "text-primary" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </div>
  );
}