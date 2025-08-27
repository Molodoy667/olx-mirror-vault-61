import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";

export function Footer() {
  return (
    <footer className="bg-card dark:bg-card/95 text-foreground border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Novado */}
          <div>
            <h3 className="text-lg font-bold mb-4">Про Novado</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:underline">Про нас</Link></li>
              <li><a href="#" className="hover:underline">Кар'єра</a></li>
              <li><a href="#" className="hover:underline">Преса</a></li>
              <li><a href="#" className="hover:underline">Блог</a></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-lg font-bold mb-4">Допомога</h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="hover:underline">Довідка</Link></li>
              <li><a href="#" className="hover:underline">Безпека</a></li>
              <li><a href="#" className="hover:underline">Правила користування</a></li>
              <li><a href="#" className="hover:underline">Політика конфіденційності</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4">Послуги</h3>
            <ul className="space-y-2">
              <li><Link to="/novado-pro" className="hover:underline">Novado PRO</Link></li>
              <li><a href="#" className="hover:underline">Novado доставка</a></li>
              <li><a href="#" className="hover:underline">Безпечна оплата</a></li>
              <li><a href="#" className="hover:underline">Реклама на сайті</a></li>
            </ul>
          </div>

          {/* Mobile Apps & Social */}
          <div>
            <h3 className="text-lg font-bold mb-4">Додаток Novado</h3>
            <div className="flex flex-col space-y-3 mb-6">
              <img 
                src="https://statics.olx.ua/external/base/img/appstore.svg" 
                alt="App Store" 
                className="h-10 cursor-pointer"
              />
              <img 
                src="https://statics.olx.ua/external/base/img/playstore.svg" 
                alt="Google Play" 
                className="h-10 cursor-pointer"
              />
            </div>
            
            <h3 className="text-lg font-bold mb-4">Слідкуйте за нами</h3>
            <div className="flex space-x-3">
              <a href="#" className="hover:opacity-80">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:opacity-80">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:opacity-80">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="hover:opacity-80">
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm mb-4 md:mb-0">
              © 2024 Novado Clone. Всі права захищені. | 
              <span className="ml-2">Цей сайт використовує cookies</span>
            </p>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}