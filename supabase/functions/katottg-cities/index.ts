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
    const response = await fetch('https://cdn.jsdelivr.net/gh/kaminarifox/katottg-json@main/katottg.min.json');
    
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
    console.log(`Loaded settlements: ${settlementsCache.length}; regions: ${Object.keys(regionsMap).length}; districts: ${Object.keys(districtsMap).length}`);
  } catch (error) {
    console.error('Error loading KATOTTG data:', error);
    throw error;
  }
}

function searchCities(query: string, limit = 20): FilteredCity[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Якщо немає запиту, повертаємо області
  if (normalizedQuery.length === 0) {
    return Object.values(regionsMap)
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

  // Сортуємо результати з пріоритетом як в тестовой версии
  return results
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