import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, LogOut, Shield, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card dark:bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AdminSidebar />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Адмін Панель
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="hidden sm:flex"
          >
            <Home className="w-4 h-4 mr-2" />
            На сайт
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/')}
            className="sm:hidden"
          >
            <Home className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="hidden sm:flex"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Вийти
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={signOut}
            className="sm:hidden"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}