import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Car, 
  Home, 
  Shirt, 
  Baby, 
  Gamepad2,
  Briefcase,
  Heart,
  ChevronRight,
  Grid3x3,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const categoryData = [
  {
    id: "electronics",
    name: "Електроніка",
    icon: Smartphone,
    color: "bg-blue-500",
    count: 15420,
    subcategories: [
      "Телефони", "Комп'ютери", "Телевізори", "Аудіо техніка", "Фототехніка"
    ]
  },
  {
    id: "transport",
    name: "Транспорт",
    icon: Car,
    color: "bg-red-500",
    count: 8967,
    subcategories: [
      "Автомобілі", "Мотоцикли", "Велосипеди", "Автозапчастини", "Водний транспорт"
    ]
  },
  {
    id: "real-estate",
    name: "Нерухомість",
    icon: Home,
    color: "bg-green-500",
    count: 12543,
    subcategories: [
      "Квартири", "Будинки", "Ділянки", "Комерційна", "Оренда"
    ]
  },
  {
    id: "fashion",
    name: "Мода і стиль",
    icon: Shirt,
    color: "bg-purple-500",
    count: 9876,
    subcategories: [
      "Жіночий одяг", "Чоловічий одяг", "Взуття", "Аксесуари", "Сумки"
    ]
  },
  {
    id: "children",
    name: "Дитячі товари",
    icon: Baby,
    color: "bg-pink-500",
    count: 5432,
    subcategories: [
      "Іграшки", "Одяг", "Коляски", "Автокрісла", "Меблі"
    ]
  },
  {
    id: "entertainment",
    name: "Хобі та відпочинок",
    icon: Gamepad2,
    color: "bg-orange-500",
    count: 7654,
    subcategories: [
      "Ігри", "Спорт", "Музичні інструменти", "Книги", "Колекції"
    ]
  },
  {
    id: "services",
    name: "Послуги",
    icon: Briefcase,
    color: "bg-teal-500",
    count: 3210,
    subcategories: [
      "Ремонт", "Навчання", "Краса", "Доставка", "Клінінг"
    ]
  },
  {
    id: "animals",
    name: "Тварини",
    icon: Heart,
    color: "bg-amber-500",
    count: 2109,
    subcategories: [
      "Собаки", "Коти", "Птахи", "Акваріумні", "Інші тварини"
    ]
  }
];

export const CategoryBrowser = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    if (selectedCategory === categoryId) {
      navigate(`/category/${categoryId}`);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleSubcategoryClick = (subcategory: string) => {
    navigate(`/search?q=${encodeURIComponent(subcategory)}`);
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Grid3x3 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Категорії товарів</h2>
        <BarChart3 className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryData.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Card 
              key={category.id}
              className={`group cursor-pointer transition-all duration-300 overflow-hidden ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => handleCategoryClick(category.id, category.name)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color} text-white group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count.toLocaleString()} оголошень
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isSelected ? 'rotate-90' : 'group-hover:translate-x-1'
                  }`} />
                </div>

                {/* Subcategories */}
                <div className={`space-y-2 transition-all duration-300 ${
                  isSelected ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                  <div className="border-t pt-3">
                    <div className="grid grid-cols-1 gap-1">
                      {category.subcategories.map((subcategory) => (
                        <Button
                          key={subcategory}
                          variant="ghost"
                          size="sm"
                          className="justify-start text-xs h-8 hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubcategoryClick(subcategory);
                          }}
                        >
                          {subcategory}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {!isSelected && (
                  <div className="flex flex-wrap gap-1 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    {category.subcategories.slice(0, 3).map((subcategory) => (
                      <Badge 
                        key={subcategory} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {subcategory}
                      </Badge>
                    ))}
                    {category.subcategories.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{category.subcategories.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};