import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileNav } from "@/components/MobileNav";
import { PromoBanner } from "@/components/PromoBanner";
import { ScrollToTop } from "@/components/ScrollToTop";

export default function NovadoPro() {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Novado PRO
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Максимізуйте потенціал своїх оголошень з преміум послугами Novado PRO
          </p>
        </div>
      </section>

      <PromoBanner />
      
      <Footer />
      <MobileNav />
      <ScrollToTop />
    </div>
  );
}