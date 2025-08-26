import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white py-6 shadow-sm">
      <div className="container mx-auto px-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              type="text" 
              placeholder="Що шукаєте?"
              className="pl-10 h-12 text-lg border-gray-300"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Location Select */}
          <div className="relative md:w-80">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Вся Україна"
              className="pl-10 h-12 text-lg border-gray-300"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Search Button */}
          <Button type="submit" className="h-12 px-8 text-lg bg-primary hover:bg-primary-dark">
            Пошук
          </Button>
        </form>
      </div>
    </div>
  );
}