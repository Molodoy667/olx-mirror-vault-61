import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-50/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Animation */}
        <div className="relative">
          <div className="text-8xl sm:text-9xl font-black text-primary/10 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary/20 to-purple-600/20 flex items-center justify-center animate-pulse">
              <FileQuestion className="w-12 h-12 text-primary/60" />
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Сторінка не знайдена
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            На жаль, сторінка яку ви шукаете не існує або була переміщена
          </p>
          
          {/* Current Path Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm font-mono text-muted-foreground border">
            <span className="text-red-500">×</span> {location.pathname}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline" 
            className="flex-1 h-12 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Назад
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            className="flex-1 h-12 bg-gradient-to-r from-primary to-primary-dark hover:from-primary/90 hover:to-primary-dark/90 group"
          >
            <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            На головну
          </Button>
          
          <Button 
            onClick={() => navigate('/search')}
            variant="outline" 
            className="flex-1 h-12 group"
          >
            <Search className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Пошук
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-4">
            Можливо, ви шукали:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/categories')}
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              Категорії
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/help')}
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              Довідка
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/create')}
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              Подати оголошення
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
