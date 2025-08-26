import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, Zap, Shield, TrendingUp, ArrowRight, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PromoBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-y">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <Gift className="w-3 h-3 mr-1" />
                Спеціальна пропозиція
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Продавайте швидше з{" "}
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Novado PRO
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Отримайте більше переглядів, швидше продайте та заробіте більше з нашими преміум послугами
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="bg-yellow-500 p-2 rounded-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">VIP оголошення</h3>
                  <p className="text-sm text-muted-foreground">
                    Ваші оголошення будуть на топі
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">+300% переглядів</h3>
                  <p className="text-sm text-muted-foreground">
                    В середньому більше переглядів
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Швидше продаж</h3>
                  <p className="text-sm text-muted-foreground">
                    Продавайте в 2 рази швидше
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Захист від шахраїв</h3>
                  <p className="text-sm text-muted-foreground">
                    Додаткова безпека угод
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => navigate('/create')}
              >
                Спробувати PRO
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/about')}
              >
                Дізнатися більше
              </Button>
            </div>
          </div>

          {/* Right content - Statistics */}
          <div className="lg:pl-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-center">
                Результати Novado PRO користувачів
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">2.5x</div>
                  <div className="text-sm text-muted-foreground">швидше продають</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">+300%</div>
                  <div className="text-sm text-muted-foreground">більше переглядів</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
                  <div className="text-sm text-muted-foreground">задоволених клієнтів</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
                  <div className="text-sm text-muted-foreground">підтримка</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-lg">
                <p className="text-sm text-center">
                  <strong>Перший місяць безкоштовно!</strong><br />
                  Спробуйте всі переваги PRO без зобов'язань
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};