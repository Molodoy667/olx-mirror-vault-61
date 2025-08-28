import { Link } from "react-router-dom";
import { Home, Search, Plus, Heart, User, BookmarkPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function MobileNav() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Only show for authenticated users
  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
      <div className="grid grid-cols-6 h-16">
        <Link to="/home" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Головна</span>
        </Link>
        
        <Link to="/search" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Search className="w-5 h-5" />
          <span className="text-xs mt-1">Пошук</span>
        </Link>
        
        <button 
          onClick={() => user ? navigate('/create') : navigate('/auth')}
          className="flex flex-col items-center justify-center text-white bg-gradient-to-r from-primary to-primary-dark rounded-full mx-2 my-2 hover:shadow-glow transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
        
        <Link 
          to={user ? "/saved-searches" : "/auth"} 
          className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <BookmarkPlus className="w-5 h-5" />
          <span className="text-xs mt-1">Збережені</span>
        </Link>
        
        <Link 
          to={user ? "/favorites" : "/auth"} 
          className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <Heart className="w-5 h-5" />
          <span className="text-xs mt-1">Обране</span>
        </Link>
        
        <Link 
          to="/auth" 
          onClick={async (e) => {
            if (user) {
              e.preventDefault();
              try {
                const { getProfileUrlForUser } = await import('@/lib/profileUtils');
                const profileUrl = await getProfileUrlForUser(user.id);
                window.location.href = profileUrl;
              } catch (error) {
                window.location.href = `/profile/${user.id}`;
              }
            }
          }} 
          className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Профіль</span>
        </Link>
      </div>
    </div>
  );
}