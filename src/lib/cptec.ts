// CPTEC/INPE API Client
// Previsão de tempo do Centro de Previsão de Tempo e Estudos Climáticos
// API XML pública: http://servicos.cptec.inpe.br/XML/

export interface CptecCity {
  id: number;
  name: string;
  state: string;
}

export interface CptecForecastDay {
  date: string; // dd/MM/yyyy
  weatherCode: string;
  weatherDescription: string;
  tempMax: number;
  tempMin: number;
  uvIndex?: number;
}

export interface CptecCurrentConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: string;
  description: string;
  updatedAt: string;
}

// Weather code descriptions (CPTEC siglas)
const weatherDescriptions: Record<string, string> = {
  ec: "Encoberto com Chuvas Isoladas",
  ci: "Chuvas Isoladas",
  c: "Chuva",
  in: "Instável",
  pp: "Possibilidade de Pancadas de Chuva",
  cm: "Chuva pela Manhã",
  ct: "Chuva à Tarde",
  cn: "Chuva à Noite",
  pt: "Pancadas de Chuva à Tarde",
  pm: "Pancadas de Chuva pela Manhã",
  np: "Nublado e Pancadas de Chuva",
  pc: "Pancadas de Chuva",
  pn: "Parcialmente Nublado",
  cv: "Chuvisco",
  ch: "Chuvoso",
  t: "Tempestade",
  ps: "Predomínio de Sol",
  e: "Encoberto",
  n: "Nublado",
  cl: "Céu Limpo",
  nv: "Nevoeiro",
  g: "Geada",
  ne: "Neve",
  nd: "Não Definido",
  pnt: "Pancadas de Chuva à Noite",
  psc: "Possibilidade de Chuva",
  pcm: "Possibilidade de Chuva pela Manhã",
  pct: "Possibilidade de Chuva à Tarde",
  pcn: "Possibilidade de Chuva à Noite",
  npt: "Nublado com Pancadas à Tarde",
  npn: "Nublado com Pancadas à Noite",
  ncn: "Nublado com Poss. de Chuva à Noite",
  nct: "Nublado com Poss. de Chuva à Tarde",
  ncm: "Nublado com Poss. de Chuva pela Manhã",
  npm: "Nublado com Pancadas pela Manhã",
  npp: "Nublado com Possibilidade de Chuva",
  vn: "Variação de Nebulosidade",
  ct1: "Chuvisco à Tarde",
  cm1: "Chuvisco pela Manhã",
  cn1: "Chuvisco à Noite",
};

// Parse XML response (simple parser for CPTEC's format)
function parseXmlTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function parseXmlTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const results: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

// Search cities in CPTEC database
export async function searchCptecCities(query: string): Promise<CptecCity[]> {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://servicos.cptec.inpe.br/XML/listaCidades?city=${encodeURIComponent(query)}`
    );
    if (!response.ok) return [];

    const xml = await response.text();
    const cities = parseXmlTags(xml, "cidade");

    return cities.map((cityXml) => ({
      id: parseInt(parseXmlTag(cityXml, "id") || "0"),
      name: parseXmlTag(cityXml, "nome") || "",
      state: parseXmlTag(cityXml, "uf") || "",
    })).filter((c) => c.id > 0);
  } catch (e) {
    console.warn("CPTEC city search failed:", e);
    return [];
  }
}

// Get 4-day forecast for a city by CPTEC code
export async function getCptecForecast(cityCode: number): Promise<CptecForecastDay[]> {
  try {
    const response = await fetch(
      `https://servicos.cptec.inpe.br/XML/cidade/${cityCode}/previsao.xml`
    );
    if (!response.ok) return [];

    const xml = await response.text();
    const days = parseXmlTags(xml, "previsao");

    return days.map((dayXml) => {
      const weatherCode = parseXmlTag(dayXml, "tempo") || "nd";
      return {
        date: parseXmlTag(dayXml, "dia") || "",
        weatherCode,
        weatherDescription: weatherDescriptions[weatherCode.toLowerCase()] || weatherCode,
        tempMax: parseFloat(parseXmlTag(dayXml, "maxima") || "0"),
        tempMin: parseFloat(parseXmlTag(dayXml, "minima") || "0"),
        uvIndex: parseFloat(parseXmlTag(dayXml, "iuv") || "0") || undefined,
      };
    });
  } catch (e) {
    console.warn("CPTEC forecast fetch failed:", e);
    return [];
  }
}

// Get extended 7-day forecast
export async function getCptecExtendedForecast(cityCode: number): Promise<CptecForecastDay[]> {
  try {
    const response = await fetch(
      `https://servicos.cptec.inpe.br/XML/cidade/7dias/${cityCode}/previsao.xml`
    );
    if (!response.ok) return getCptecForecast(cityCode); // fallback to 4-day

    const xml = await response.text();
    const days = parseXmlTags(xml, "previsao");

    return days.map((dayXml) => {
      const weatherCode = parseXmlTag(dayXml, "tempo") || "nd";
      return {
        date: parseXmlTag(dayXml, "dia") || "",
        weatherCode,
        weatherDescription: weatherDescriptions[weatherCode.toLowerCase()] || weatherCode,
        tempMax: parseFloat(parseXmlTag(dayXml, "maxima") || "0"),
        tempMin: parseFloat(parseXmlTag(dayXml, "minima") || "0"),
        uvIndex: parseFloat(parseXmlTag(dayXml, "iuv") || "0") || undefined,
      };
    });
  } catch (e) {
    console.warn("CPTEC extended forecast failed:", e);
    return [];
  }
}

// Find nearest CPTEC city for a given location name
export async function findCptecCity(cityName: string, state?: string): Promise<CptecCity | null> {
  const cities = await searchCptecCities(cityName);
  if (cities.length === 0) return null;

  // If state is provided, prefer a match
  if (state) {
    const stateMatch = cities.find(
      (c) => c.state.toLowerCase() === state.toLowerCase()
    );
    if (stateMatch) return stateMatch;
  }

  return cities[0];
}
