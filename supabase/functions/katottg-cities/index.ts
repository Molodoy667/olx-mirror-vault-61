import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KatottgEntry {
  code: string;
  name: string;
  type: string;
  parentCode?: string;
  level: number;
}

interface FilteredCity {
  code: string;
  name: string;
  type: string;
  region?: string;
  district?: string;
  fullName: string;
}

let katottgData: KatottgEntry[] = []; // retained for backward compatibility
let settlementsCache: FilteredCity[] = [];
let regionsMap: Record<string, string> = {};
let districtsMap: Record<string, string> = {};
let dataLoaded = false;

async function loadKatottgData() {
  if (dataLoaded && settlementsCache.length > 0) {
    return;
  }

  try {
    console.log('Loading KATOTTG data (official registry JSON)...');
    const response = await fetch('https://cdn.jsdelivr.net/gh/kaminarifox/katottg-json@main/katottg.min.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KATOTTG-Cities-Function/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch KATOTTG data: ${response.status}`);
    }

    const data = await response.json();

    // Expecting shape: { orderDate: string, categories: object, items: [] }
    const items: any[] = Array.isArray(data) ? data : (data.items ?? []);
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('KATOTTG: items array not found or empty');
    }

    regionsMap = {};
    districtsMap = {};
    settlementsCache = [];

    // First pass: regions and districts
    for (const it of items) {
      const category = it.category;
      if (category === 'O' && it.level1) {
        regionsMap[it.level1] = String(it.name ?? '').trim();
      } else if (category === 'P' && it.level2) {
        districtsMap[it.level2] = String(it.name ?? '').trim();
      }
    }

    // Second pass: settlements (cities, towns, villages, settlements)
    for (const it of items) {
      const category = it.category;
      // M=міста, T=селища міського типу, C=села, X=селища, K=міста спеціального статусу
      if (!['M', 'T', 'C', 'X', 'K'].includes(category)) continue;

      // For cities (M, K), code might be in level3, level4, or level5
      const code = it.level5 || it.level4 || it.level3;
      if (!code) continue;

      const name = String(it.name ?? '').trim();
      if (!name) continue;

      const typeName = category === 'M' ? 'м.' : 
                      category === 'K' ? 'м.' : // великі міста
                      category === 'T' ? 'смт' : 
                      category === 'C' ? 'с.' : 'с-ще';
      
      const region = regionsMap[it.level1] ?? '';
      const district = districtsMap[it.level2] ?? '';
      const fullName = region ? `${typeName} ${name}, ${region}` : `${typeName} ${name}`;

      // Debug для великих міст
      if (['Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів'].includes(name)) {
        console.log(`Major city found: ${name}, category: ${category}, type: ${typeName}, region: ${region}`);
      }

      settlementsCache.push({
        code,
        name,
        type: typeName,
        region,
        district,
        fullName
      });
    }

    dataLoaded = true;
    console.log(`KATOTTG Data loaded successfully:`);
    console.log(`- Settlements: ${settlementsCache.length}`);
    console.log(`- Regions: ${Object.keys(regionsMap).length}`);
    console.log(`- Districts: ${Object.keys(districtsMap).length}`);
    console.log(`- Sample regions:`, Object.values(regionsMap).slice(0, 5));
  } catch (error) {
    console.error('Error loading KATOTTG data:', error);
    
    // Fallback: create basic Ukrainian regions manually
    console.log('Loading fallback regions...');
    const fallbackRegions = [
      'Вінницька', 'Волинська', 'Дніпропетровська', 'Донецька', 'Житомирська',
      'Закарпатська', 'Запорізька', 'Івано-Франківська', 'Київська', 'Кіровоградська',
      'Луганська', 'Львівська', 'Миколаївська', 'Одеська', 'Полтавська',
      'Рівненська', 'Сумська', 'Тернопільська', 'Харківська', 'Херсонська',
      'Хмельницька', 'Черкаська', 'Чернівецька', 'Чернігівська'
    ];
    
    regionsMap = {};
    fallbackRegions.forEach((region, index) => {
      regionsMap[`region_${index}`] = region;
    });
    
    // Add major cities manually
    const majorCities = [
      { name: 'Київ', region: 'м. Київ', type: 'м.' },
      { name: 'Харків', region: 'Харківська', type: 'м.' },
      { name: 'Одеса', region: 'Одеська', type: 'м.' },
      { name: 'Дніпро', region: 'Дніпропетровська', type: 'м.' },
      { name: 'Львів', region: 'Львівська', type: 'м.' },
      { name: 'Запоріжжя', region: 'Запорізька', type: 'м.' },
      { name: 'Кривий Ріг', region: 'Дніпропетровська', type: 'м.' },
      { name: 'Миколаїв', region: 'Миколаївська', type: 'м.' },
      { name: 'Маріуполь', region: 'Донецька', type: 'м.' },
      { name: 'Луганск', region: 'Луганська', type: 'м.' },
      { name: 'Вінниця', region: 'Вінницька', type: 'м.' },
      { name: 'Макіївка', region: 'Донецька', type: 'м.' },
      { name: 'Севастополь', region: 'АР Крим', type: 'м.' },
      { name: 'Сімферополь', region: 'АР Крим', type: 'м.' },
      { name: 'Херсон', region: 'Херсонська', type: 'м.' },
      { name: 'Полтава', region: 'Полтавська', type: 'м.' },
      { name: 'Чернігів', region: 'Чернігівська', type: 'м.' },
      { name: 'Черкаси', region: 'Черкаська', type: 'м.' },
      { name: 'Житомир', region: 'Житомирська', type: 'м.' },
      { name: 'Суми', region: 'Сумська', type: 'м.' },
      { name: 'Хмельницький', region: 'Хмельницька', type: 'м.' },
      { name: 'Чернівці', region: 'Чернівецька', type: 'м.' },
      { name: 'Рівне', region: 'Рівненська', type: 'м.' },
      { name: 'Кам\'янське', region: 'Дніпропетровська', type: 'м.' },
      { name: 'Кропивницький', region: 'Кіровоградська', type: 'м.' },
      { name: 'Івано-Франківськ', region: 'Івано-Франківська', type: 'м.' },
      { name: 'Кременчук', region: 'Полтавська', type: 'м.' },
      { name: 'Тернопіль', region: 'Тернопільська', type: 'м.' },
      { name: 'Луцьк', region: 'Волинська', type: 'м.' },
      { name: 'Біла Церква', region: 'Київська', type: 'м.' },
      { name: 'Краматорськ', region: 'Донецька', type: 'м.' },
      { name: 'Мелітополь', region: 'Запорізька', type: 'м.' },
      { name: 'Керч', region: 'АР Крим', type: 'м.' },
      { name: 'Словʼянськ', region: 'Донецька', type: 'м.' },
      { name: 'Ужгород', region: 'Закарпатська', type: 'м.' },
      { name: 'Бердянськ', region: 'Запорізька', type: 'м.' },
      { name: 'Алчевськ', region: 'Луганська', type: 'м.' },
      { name: 'Павлоград', region: 'Дніпропетровська', type: 'м.' },
      { name: 'Сєвєродонецьк', region: 'Луганська', type: 'м.' },
      { name: 'Євпаторія', region: 'АР Крим', type: 'м.' },
      { name: 'Лисичанськ', region: 'Луганська', type: 'м.' },
      { name: 'Кам\'янець-Подільський', region: 'Хмельницька', type: 'м.' },
      { name: 'Бровари', region: 'Київська', type: 'м.' },
      { name: 'Дрогобич', region: 'Львівська', type: 'м.' },
      { name: 'Конотоп', region: 'Сумська', type: 'м.' },
      { name: 'Нікополь', region: 'Дніпропетровська', type: 'м.' },
      { name: 'Ялта', region: 'АР Крим', type: 'м.' },
      { name: 'Новомосковськ', region: 'Дніпропетровська', type: 'м.' },
      { name: 'Стрий', region: 'Львівська', type: 'м.' },
      { name: 'Мукачево', region: 'Закарпатська', type: 'м.' },
      { name: 'Коломия', region: 'Івано-Франківська', type: 'м.' },
      { name: 'Умань', region: 'Черкаська', type: 'м.' },
      { name: 'Бердичів', region: 'Житомирська', type: 'м.' },
      { name: 'Калуш', region: 'Івано-Франківська', type: 'м.' },
      { name: 'Апостолове', region: 'Дніпропетровська', type: 'м.' },
      { name: 'Червоноград', region: 'Львівська', type: 'м.' },
      { name: 'Фастів', region: 'Київська', type: 'м.' },
      { name: 'Рубіжне', region: 'Луганська', type: 'м.' },
      { name: 'Южне', region: 'Одеська', type: 'м.' },
      { name: 'Ладижин', region: 'Вінницька', type: 'м.' },
      { name: 'Львівська', region: 'Львівська', type: 'обл.' },
      { name: 'Харківська', region: 'Харківська', type: 'обл.' },
      { name: 'Одеська', region: 'Одеська', type: 'обл.' },
      { name: 'Дніпропетровська', region: 'Дніпропетровська', type: 'обл.' },
      { name: 'Київська', region: 'Київська', type: 'обл.' }
    ];
    
    settlementsCache = majorCities.map((city, index) => ({
      code: `fallback_city_${index}`,
      name: city.name,
      type: city.type,
      region: city.region,
      district: '',
      fullName: `${city.type} ${city.name}, ${city.region}`
    }));
    
    dataLoaded = true;
    console.log(`Loaded fallback data: ${Object.keys(regionsMap).length} regions, ${settlementsCache.length} cities`);
  }
}

function searchCities(query: string, limit = 20): FilteredCity[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Якщо немає запиту, повертаємо області
  if (normalizedQuery.length === 0) {
    const regions = Object.values(regionsMap)
      .map(regionName => ({
        code: `region_${regionName}`,
        name: regionName,
        type: 'обл.',
        region: regionName,
        district: '',
        fullName: `${regionName} область`
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
      .slice(0, limit);
    
    console.log(`Returning ${regions.length} regions for empty query. Regions available: ${Object.keys(regionsMap).length}`);
    return regions;
  }

  if (normalizedQuery.length < 2) {
    return [];
  }

  const results: FilteredCity[] = [];
  
  // Додаємо області що підходять під запит
  Object.values(regionsMap).forEach(regionName => {
    if (regionName.toLowerCase().includes(normalizedQuery)) {
      results.push({
        code: `region_${regionName}`,
        name: regionName,
        type: 'обл.',
        region: regionName,
        district: '',
        fullName: `${regionName} область`
      });
    }
  });

  // Додаємо райони що підходять під запит
  Object.values(districtsMap).forEach(districtName => {
    if (districtName.toLowerCase().includes(normalizedQuery)) {
      // Знаходимо область для цього району
      let regionForDistrict = '';
      for (const item of settlementsCache) {
        if (item.district === districtName && item.region) {
          regionForDistrict = item.region;
          break;
        }
      }
      
      results.push({
        code: `district_${districtName}`,
        name: districtName,
        type: 'р-н',
        region: regionForDistrict,
        district: districtName,
        fullName: regionForDistrict ? `${districtName} район, ${regionForDistrict}` : `${districtName} район`
      });
    }
  });

  // Додаємо населені пункти
  settlementsCache.forEach((s) => {
    if (s.name.toLowerCase().includes(normalizedQuery) ||
        (s.region?.toLowerCase().includes(normalizedQuery)) ||
        (s.district?.toLowerCase().includes(normalizedQuery))) {
      results.push(s);
    }
  });

  // Спеціальна логіка для великих міст - додаємо райони
  if (normalizedQuery === 'київ' || normalizedQuery.includes('київ')) {
    const kyivDistricts = [
      'Голосіївський', 'Дарницький', 'Деснянський', 'Днípровський', 
      'Оболонський', 'Печерський', 'Подільський', 'Святошинський', 
      'Солом\'янський', 'Шевченківський'
    ];
    
    kyivDistricts.forEach(district => {
      results.push({
        code: `kyiv_district_${district}`,
        name: `${district} район`,
        type: 'р-н',
        region: 'м. Київ',
        district: district,
        fullName: `${district} район, м. Київ`
      });
    });
  }

  if (normalizedQuery === 'харків' || normalizedQuery.includes('харків')) {
    const kharkivDistricts = [
      'Київський', 'Холодногірський', 'Шевченківський', 'Слобідський',
      'Немишлянський', 'Новобаварський', 'Основ\'янський', 'Інтичівський'
    ];
    
    kharkivDistricts.forEach(district => {
      results.push({
        code: `kharkiv_district_${district}`,
        name: `${district} район`,
        type: 'р-н',
        region: 'м. Харків',
        district: district,
        fullName: `${district} район, м. Харків`
      });
    });
  }

  if (normalizedQuery === 'одеса' || normalizedQuery.includes('одеса')) {
    const odesaDistricts = [
      'Київський', 'Малиновський', 'Приморський', 'Суворовський'
    ];
    
    odesaDistricts.forEach(district => {
      results.push({
        code: `odesa_district_${district}`,
        name: `${district} район`,
        type: 'р-н',
        region: 'м. Одеса',
        district: district,
        fullName: `${district} район, м. Одеса`
      });
    });
  }

  // Видаляємо дублікати перед сортуванням
  const uniqueResults = results.filter((item, index, self) => 
    index === self.findIndex(t => t.fullName === item.fullName)
  );

  console.log(`Before deduplication: ${results.length}, after: ${uniqueResults.length} results for query: "${normalizedQuery}"`);

  // Сортуємо результати з пріоритетом як в тестовой версии
  return uniqueResults
    .sort((a, b) => {
      // Exact name matches first
      const aExact = a.name.toLowerCase() === normalizedQuery;
      const bExact = b.name.toLowerCase() === normalizedQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Priority by type - ИМЕННО ТАК КАК В ТЕСТОВОЙ ВЕРСИИ
      const getTypePriority = (type: string) => {
        switch(type) {
          case 'обл.': return 1; // области
          case 'р-н': return 2;  // районы
          case 'м.': return 3;   // города
          case 'смт': return 4;  // пгт
          case 'с-ще': return 5; // поселки
          case 'с.': return 6;   // села
          default: return 7;
        }
      };
      
      const aPriority = getTypePriority(a.type);
      const bPriority = getTypePriority(b.type);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Within same type, alphabetically
      return a.name.localeCompare(b.name, 'uk');
    })
    .slice(0, limit);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    console.log('KATOTTG Edge Function: Received query:', query);
    
    // Загружаем данные КАТОТТГ если еще не загружены
    await loadKatottgData();

    // Ищем города (включая области и районы)
    const cities = searchCities(query || '', 20);

    console.log(`KATOTTG Edge Function: Found ${cities.length} results for query: "${query}"`);

    return new Response(JSON.stringify({ cities }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in katottg-cities function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      cities: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});