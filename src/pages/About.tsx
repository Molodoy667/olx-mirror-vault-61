import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Про Novado</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            Novado — це найбільший онлайн-майданчик оголошень в Україні, де мільйони людей щодня купують і продають товари та послуги.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Наша місія</h2>
            <p className="text-muted-foreground">
              Ми прагнемо зробити торгівлю простою та доступною для кожного, створюючи можливості для людей покращувати своє життя через купівлю, продаж та обмін товарами.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Наші цінності</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li>• Довіра та безпека користувачів</li>
              <li>• Простота та зручність використання</li>
              <li>• Інноваційність та постійний розвиток</li>
              <li>• Підтримка локальних спільнот</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Цифри говорять самі за себе</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-card p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary mb-2">10М+</div>
                <div className="text-muted-foreground">Активних користувачів</div>
              </div>
              <div className="bg-card p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary mb-2">1М+</div>
                <div className="text-muted-foreground">Оголошень щомісяця</div>
              </div>
              <div className="bg-card p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary mb-2">100+</div>
                <div className="text-muted-foreground">Категорій товарів</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}