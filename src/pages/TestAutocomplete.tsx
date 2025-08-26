import { useState } from 'react';
import { KatottgCityAutocomplete } from '@/components/KatottgCityAutocomplete';

export default function TestAutocomplete() {
  const [selectedCity, setSelectedCity] = useState('');

  return (
    <div className="container mx-auto p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Тест автокомплита городов</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Выберите город:
          </label>
          <KatottgCityAutocomplete
            value={selectedCity}
            onChange={setSelectedCity}
            placeholder="Введите название города..."
            showRegionsOnEmpty={true}
          />
        </div>
        
        {selectedCity && (
          <div className="p-4 bg-gray-100 rounded">
            <strong>Выбрано:</strong> {selectedCity}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Тест:</strong></p>
          <p>1. Оставьте поле пустым - должны показаться области</p>
          <p>2. Введите "львів" - должна быть сортировка по приоритету</p>
          <p>3. Смотрите DEBUG информацию в консоли браузера</p>
        </div>
      </div>
    </div>
  );
}