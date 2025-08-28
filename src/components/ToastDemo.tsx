import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showSaveSuccess,
  showFileUploadSuccess,
  showValidationError,
  showNetworkError,
  showListingPublished,
  showMessageSent
} from "@/lib/toast-helpers";

export function ToastDemo() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🎉 Демонстрація анімованих уведомлень</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="default" 
            onClick={() => showSuccessToast("Успіх!", "Операція виконана успішно")}
            className="bg-green-600 hover:bg-green-700"
          >
            ✅ Успіх
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={() => showErrorToast("Помилка!", "Щось пішло не так")}
          >
            ❌ Помилка
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => showWarningToast("Увага!", "Перевірте дані")}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            ⚠️ Попередження
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => showInfoToast("Інформація", "Корисна інформація для вас")}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            ℹ️ Інфо
          </Button>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Спеціальні уведомлення:</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => showSaveSuccess("Дані")}
              size="sm"
            >
              💾 Збереження
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => showFileUploadSuccess("document.pdf")}
              size="sm"
            >
              📤 Завантаження
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => showValidationError("Неправильний email формат")}
              size="sm"
            >
              🔍 Валідація
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => showNetworkError()}
              size="sm"
            >
              🌐 Мережа
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => showListingPublished()}
              size="sm"
            >
              📢 Оголошення
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => showMessageSent()}
              size="sm"
            >
              💬 Повідомлення
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <strong>Особливості:</strong>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Автоматичне зникнення через 3 секунди</li>
            <li>Анімований progress bar знизу</li>
            <li>Різні кольори для різних типів</li>
            <li>Іконки відповідно до типу уведомлення</li>
            <li>Плавні анімації появи та зникнення</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}