import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Розділи на сервісі Novado</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-20 h-20 rounded-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Розділи на сервісі Novado</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories?.map((category) => {
            // Dynamically get the icon component
            const IconComponent = category.icon ? (Icons as Record<string, unknown>)[category.icon] : Icons.Package;
            
            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="flex flex-col items-center group hover:scale-105 transition-transform"
              >
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-md group-hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: category.color || '#6366f1' }}
                >
                  {IconComponent && <IconComponent className="w-10 h-10 text-white" />}
                </div>
                <span className="text-sm text-center font-medium text-foreground group-hover:text-primary">
                  {category.name_uk}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}