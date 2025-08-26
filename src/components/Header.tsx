import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, User, Plus, LogOut, Package, Shield, BookmarkPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { LanguageSelector } from "./LanguageSelector";
import { TouchSidebar, TouchMenuButton } from "./TouchSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className="text-3xl font-bold tracking-wider bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">Novado</div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => navigate('/messages')}
                className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Чат</span>
              </button>
              
              <LanguageSelector />
              
              <ThemeToggle />

              {user ? (
                <>
                  <NotificationBell />
                  
                  <button 
                    onClick={() => navigate('/favorites')}
                    className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
                        <User className="w-5 h-5" />
                        <span>Ваш профіль</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>
                        <User className="w-4 h-4 mr-2" />
                        Мій профіль
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-listings')}>
                        <Package className="w-4 h-4 mr-2" />
                        Мої оголошення
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/saved-searches')}>
                        <Search className="w-4 h-4 mr-2" />
                        Збережені пошуки
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/favorites')}>
                        <Heart className="w-4 h-4 mr-2" />
                        Обрані
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/messages')}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Повідомлення
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('/admin')}>
                            <Shield className="w-4 h-4 mr-2" />
                            Адмін панель
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Вийти
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-glow font-semibold px-6 flex items-center space-x-2 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Додати оголошення</span>
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-glow font-semibold px-6">
                    Увійти
                  </Button>
                </Link>
              )}
            </nav>

            {/* Touch-friendly menu button */}
            <div className="md:hidden">
              <TouchMenuButton onClick={() => setSidebarOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* Touch Sidebar */}
      <TouchSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
    </>
  );
}