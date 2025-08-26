import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NovaPoshtaCity {
  Ref: string;
  Description: string;
  DescriptionRu: string;
  Delivery1: string;
  Delivery2: string;
  Delivery3: string;
  Delivery4: string;
  Delivery5: string;
  Delivery6: string;
  Delivery7: string;
  Area: string;
  SettlementType: string;
  IsBranch: string;
  PreventEntryNewStreetsUser: string;
  Conglomerates: string;
  CityID: string;
  SettlementTypeDescription: string;
  SettlementTypeDescriptionRu: string;
  SpecialCashCheck: number;
  AreaDescription: string;
  AreaDescriptionRu: string;
}

interface NovaPoshtaResponse {
  success: boolean;
  data: NovaPoshtaCity[];
  errors: string[];
  warnings: string[];
  info: string[];
  messageCodes: string[];
  errorCodes: string[];
  warningCodes: string[];
  infoCodes: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ cities: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('NOVA_POSHTA_API_KEY');
    
    if (!apiKey) {
      console.error('Nova Poshta API key not found');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Запрос к API Новой Почты для поиска городов
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: apiKey,
        modelName: 'Address',
        calledMethod: 'getCities',
        methodProperties: {
          FindByString: query,
          Limit: 20
        }
      }),
    });

    if (!response.ok) {
      console.error('Nova Poshta API error:', response.status, response.statusText);
      return new Response(JSON.stringify({ error: 'Failed to fetch cities' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data: NovaPoshtaResponse = await response.json();
    
    if (!data.success) {
      console.error('Nova Poshta API errors:', data.errors);
      return new Response(JSON.stringify({ error: 'API request failed', errors: data.errors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Форматируем данные для фронтенда
    const cities = data.data.map(city => ({
      ref: city.Ref,
      name: city.Description,
      nameRu: city.DescriptionRu,
      area: city.AreaDescription,
      areaRu: city.AreaDescriptionRu,
      settlementType: city.SettlementTypeDescription,
      fullName: `${city.Description}, ${city.AreaDescription}`
    }));

    console.log(`Found ${cities.length} cities for query: ${query}`);

    return new Response(JSON.stringify({ cities }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in nova-poshta-cities function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});