import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Menu, 
  X, 
  User, 
  Heart, 
  MessageCircle, 
  Plus, 
  LogOut, 
  Package, 
  Shield, 
  BookmarkPlus, 
  Search,
  UserPlus,
  LogIn,
  Home,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import { GradientAvatar } from "@/components/ui/gradient-avatar";
import { supabase } from "@/integrations/supabase/client";

interface TouchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function TouchSidebar({ isOpen, onClose, onToggle }: TouchSidebarProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const startY = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);

  // Запит для отримання даних профілю
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Handle touch events for swipe gestures and scrolling
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const content = contentRef.current;
    if (!sidebar || !content) return;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
      isScrolling.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      
      currentX.current = e.touches[0].clientX;
      const deltaX = currentX.current - startX.current;
      const deltaY = Math.abs(e.touches[0].clientY - startY.current);
      
      // Determine if user is trying to scroll or swipe
      if (deltaY > Math.abs(deltaX) && deltaY > 10) {
        isScrolling.current = true;
        isDragging.current = false;
        return;
      }
      
      // Prevent scrolling while swiping horizontally
      if (Math.abs(deltaX) > 10 && !isScrolling.current) {
        e.preventDefault();
        
        // Allow swipe to close when open
        if (isOpen && deltaX < -50) {
          sidebar.style.transform = `translateX(${Math.max(deltaX, -300)}px)`;
        }
        // Allow swipe to open when closed
        if (!isOpen && deltaX > 50) {
          sidebar.style.transform = `translateX(${Math.min(deltaX - 300, 0)}px)`;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current || isScrolling.current) return;
      isDragging.current = false;
      
      const deltaX = currentX.current - startX.current;
      sidebar.style.transform = '';
      
      // Close if swiped left significantly while open
      if (isOpen && deltaX < -100) {
        onClose();
      }
      // Open if swiped right significantly while closed
      if (!isOpen && deltaX > 100) {
        onToggle();
      }
    };

    // Handle swipe from edge to open
    const handleEdgeSwipe = (e: TouchEvent) => {
      if (!isOpen && e.touches[0].clientX < 20) {
        handleTouchStart(e);
      }
    };

    // Handle swipe from edge to close
    const handleEdgeSwipeClose = (e: TouchEvent) => {
      if (isOpen && e.touches[0].clientX > window.innerWidth - 20) {
        handleTouchStart(e);
      }
    };

    sidebar.addEventListener('touchstart', handleTouchStart, { passive: false });
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: false });
    sidebar.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchstart', handleEdgeSwipe, { passive: false });
    document.addEventListener('touchstart', handleEdgeSwipeClose, { passive: false });

    return () => {
      sidebar.removeEventListener('touchstart', handleTouchStart);
      sidebar.removeEventListener('touchmove', handleTouchMove);
      sidebar.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchstart', handleEdgeSwipe);
      document.removeEventListener('touchstart', handleEdgeSwipeClose);
    };
  }, [isOpen, onClose, onToggle]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    onClose();
  };

  const menuItems = user ? [
    { 
      icon: Home, 
      label: 'Головна', 
      action: () => handleNavigation('/'),
      color: 'text-primary'
    },
    { 
      icon: User, 
      label: 'Мій профіль', 
      action: () => handleNavigation(profile?.username ? `/profile/@${profile.username}` : user?.user_metadata?.username ? `/profile/@${user.user_metadata.username}` : `/profile/${user?.id}`),
      color: 'text-blue-500'
    },
    { 
      icon: Package, 
      label: 'Мої оголошення', 
      action: () => handleNavigation('/my-listings'),
      color: 'text-green-500'
    },
    { 
      icon: MessageCircle, 
      label: 'Повідомлення', 
      action: () => handleNavigation('/messages'),
      color: 'text-purple-500'
    },
    { 
      icon: Plus, 
      label: 'Додати оголошення', 
      action: () => handleNavigation('/create'),
      color: 'text-primary',
      highlight: true
    },
    ...(isAdmin ? [{ 
      icon: Shield, 
      label: 'Адмін панель', 
      action: () => handleNavigation('/admin'),
      color: 'text-amber-500'
    }] : []),
    { 
      icon: LogOut, 
      label: 'Вийти', 
      action: handleSignOut,
      color: 'text-red-600'
    }
  ] : [
    { 
      icon: Home, 
      label: 'Головна', 
      action: () => handleNavigation('/'),
      color: 'text-primary'
    },
    { 
      icon: Search, 
      label: 'Пошук', 
      action: () => handleNavigation('/search'),
      color: 'text-orange-500'
    },
    { 
      icon: LogIn, 
      label: 'Вхід', 
      action: () => handleNavigation('/auth'),
      color: 'text-primary',
      highlight: true
    },
    { 
      icon: UserPlus, 
      label: 'Реєстрація', 
      action: () => handleNavigation('/auth'),
      color: 'text-green-500'
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-card border-r border-border z-50 transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 to-primary-dark/10">
          <div className="flex items-center space-x-3 flex-1">
            {user ? (
              <>
                <GradientAvatar
                  src={profile?.avatar_url || user.user_metadata?.avatar_url}
                  username={profile?.username || user.user_metadata?.username || user.email?.split('@')[0]}
                  size="lg"
                  className="border-2 border-primary/20 flex-shrink-0"
                  alt="User Avatar"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Користувач'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {profile?.username ? `@${profile.username}` : user.email}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Novado
              </div>
            )}
          </div>
          
          {/* Settings button for authenticated users */}
          {user && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleNavigation('/edit-profile')}
              className="hover:bg-primary/10 flex-shrink-0"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="hover:bg-primary/10 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Menu Items */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        >
          <div className="space-y-2 px-4">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={cn(
                  "w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 text-left",
                  item.highlight 
                    ? "bg-gradient-to-r from-primary/10 to-primary-dark/10 hover:from-primary/20 hover:to-primary-dark/20 border border-primary/20" 
                    : "hover:bg-muted/50",
                  "active:scale-95 touch-manipulation"
                )}
              >
                <item.icon className={cn("w-6 h-6", item.color)} />
                <span className={cn(
                  "font-medium",
                  item.highlight ? "text-primary" : "text-foreground"
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-2">
              © 2024 Novado
            </div>
            <div className="text-xs text-muted-foreground">
              Свайп вліво для закриття
            </div>
          </div>
        </div>

        {/* Swipe indicators */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
          <div className="w-1 h-16 bg-primary/30 rounded-r-lg" />
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
          <div className="w-1 h-16 bg-primary/30 rounded-l-lg" />
        </div>
      </div>
    </>
  );
}

// Touch-friendly menu button
export function TouchMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "relative w-12 h-12 rounded-full",
        "bg-gradient-to-br from-primary/10 to-primary-dark/10",
        "hover:from-primary/20 hover:to-primary-dark/20",
        "active:scale-95 transition-all duration-200 touch-manipulation",
        "border border-primary/20"
      )}
    >
      <Menu className="w-6 h-6 text-primary" />
      <span className="sr-only">Відкрити меню</span>
    </Button>
  );
}