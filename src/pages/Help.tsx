import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Help() {
  const faqs = [
    {
      question: "Як створити оголошення?",
      answer: "Щоб створити оголошення, увійдіть у свій акаунт та натисніть кнопку 'Додати оголошення'. Заповніть всі необхідні поля, додайте фотографії та опублікуйте."
    },
    {
      question: "Як зв'язатися з продавцем?",
      answer: "На сторінці оголошення натисніть кнопку 'Написати продавцю'. Ви зможете відправити повідомлення через внутрішній чат Novado."
    },
    {
      question: "Чи безпечно купувати на Novado?",
      answer: "Ми рекомендуємо зустрічатися в громадських місцях, перевіряти товар перед покупкою та не надсилати передоплату. Використовуйте функцію 'Безпечна оплата' для додаткового захисту."
    },
    {
      question: "Як видалити оголошення?",
      answer: "Зайдіть у свій профіль, знайдіть потрібне оголошення та натисніть кнопку 'Видалити'. Підтвердіть дію."
    },
    {
      question: "Скільки коштує розміщення оголошення?",
      answer: "Базове розміщення оголошень безкоштовне. Додаткові послуги просування оплачуються окремо."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Центр допомоги</h1>
        
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Часті запитання</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Потрібна додаткова допомога?</h2>
          <p className="text-muted-foreground mb-4">
            Наша команда підтримки готова допомогти вам з будь-якими питаннями.
          </p>
          <div className="space-y-2">
            <p>📧 Email: support@novado.ua</p>
            <p>📞 Телефон: 0 800 123 456</p>
            <p>🕐 Графік роботи: Пн-Пт 9:00-18:00</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}