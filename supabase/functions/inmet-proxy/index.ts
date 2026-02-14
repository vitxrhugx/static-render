const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const INMET_BASE_URL = 'https://apitempo.inmet.gov.br';

interface InmetRawObservation {
  DT_MEDICAO: string;
  HR_MEDICAO: string;
  TEM_MAX: string | null;
  TEM_MIN: string | null;
  TEM_INS: string | null;
  CHUVA: string | null;
  VEN_VEL: string | null;
  VEN_RAJ: string | null;
  UMD_INS: string | null;
  PRE_INS: string | null;
  RAD_GLO: string | null;
  CD_ESTACAO: string;
  DC_NOME: string;
}

function parseFloat2(val: string | null): number | null {
  if (val === null || val === '' || val === undefined) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : Math.round(n * 10) / 10;
}

function aggregateDaily(observations: InmetRawObservation[]) {
  const byDate = new Map<string, InmetRawObservation[]>();
  
  for (const obs of observations) {
    const date = obs.DT_MEDICAO;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(obs);
  }

  return Array.from(byDate.entries()).map(([date, obs]) => {
    const temps = obs.map(o => parseFloat2(o.TEM_INS)).filter(t => t !== null) as number[];
    const maxTemps = obs.map(o => parseFloat2(o.TEM_MAX)).filter(t => t !== null) as number[];
    const minTemps = obs.map(o => parseFloat2(o.TEM_MIN)).filter(t => t !== null) as number[];
    const precips = obs.map(o => parseFloat2(o.CHUVA)).filter(p => p !== null) as number[];
    const winds = obs.map(o => parseFloat2(o.VEN_VEL)).filter(w => w !== null) as number[];
    const gusts = obs.map(o => parseFloat2(o.VEN_RAJ)).filter(w => w !== null) as number[];
    const humids = obs.map(o => parseFloat2(o.UMD_INS)).filter(h => h !== null) as number[];
    const rads = obs.map(o => parseFloat2(o.RAD_GLO)).filter(r => r !== null) as number[];

    return {
      date,
      tempMax: maxTemps.length > 0 ? Math.max(...maxTemps) : (temps.length > 0 ? Math.max(...temps) : null),
      tempMin: minTemps.length > 0 ? Math.min(...minTemps) : (temps.length > 0 ? Math.min(...temps) : null),
      precipitation: precips.length > 0 ? precips.reduce((a, b) => a + b, 0) : null,
      windMax: gusts.length > 0 ? Math.max(...gusts) : (winds.length > 0 ? Math.max(...winds) : null),
      humidity: humids.length > 0 ? Math.round(humids.reduce((a, b) => a + b, 0) / humids.length) : null,
      radiation: rads.length > 0 ? Math.round(rads.reduce((a, b) => a + b, 0) * 10) / 10 : null,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, stationCode, startDate, endDate, state } = await req.json();

    if (action === 'stations') {
      // List all automatic stations
      const url = state 
        ? `${INMET_BASE_URL}/estacoes/T/${state}`
        : `${INMET_BASE_URL}/estacoes/T`;
      
      console.log('Fetching INMET stations:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`INMET API error: ${response.status}`);
      }
      
      const stations = await response.json();
      return new Response(
        JSON.stringify({ stations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'station_data') {
      if (!stationCode || !startDate || !endDate) {
        return new Response(
          JSON.stringify({ error: 'stationCode, startDate and endDate are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch station data for date range
      // Try multiple URL patterns as INMET API varies
      const urls = [
        `${INMET_BASE_URL}/estacao/${startDate}/${endDate}/${stationCode}`,
        `${INMET_BASE_URL}/estacao/diaria/${startDate}/${endDate}/${stationCode}`,
      ];
      
      let rawData: InmetRawObservation[] | null = null;
      
      for (const tryUrl of urls) {
        console.log('Trying INMET URL:', tryUrl);
        try {
          const res = await fetch(tryUrl);
          if (!res.ok) continue;
          
          const text = await res.text();
          if (!text || text.trim() === '' || text.trim() === '[]') continue;
          
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawData = parsed;
            console.log(`Success with ${tryUrl}: ${parsed.length} records`);
            break;
          }
        } catch (e) {
          console.log(`Failed ${tryUrl}:`, e);
          continue;
        }
      }
      
      if (!rawData || rawData.length === 0) {
        return new Response(
          JSON.stringify({ data: [], message: 'Nenhum dado encontrado para esta estação no período solicitado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const dailyData = aggregateDaily(rawData);
      
      return new Response(
        JSON.stringify({ data: dailyData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "stations" or "station_data"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('INMET proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
