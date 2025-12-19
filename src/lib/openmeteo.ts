// Open-Meteo API Services

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State/Province
  admin2?: string;
  country_code: string;
}

export interface GeocodingResponse {
  results?: GeocodingResult[];
}

export interface DailyWeatherData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  wind_speed_10m_max: number[];
}

export interface HourlyWeatherData {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  wind_speed_10m: number[];
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  daily: DailyWeatherData;
  hourly: HourlyWeatherData;
}

// Geocoding API - Search for cities
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', query);
    url.searchParams.set('count', '10');
    url.searchParams.set('language', 'pt');
    url.searchParams.set('country_code', 'BR');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: GeocodingResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

// Historical Weather API - Get weather data for a location
export async function getHistoricalWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResponse | null> {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 7 days ago

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const url = new URL('https://archive-api.open-meteo.com/v1/archive');
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('start_date', formatDate(startDate));
    url.searchParams.set('end_date', formatDate(endDate));
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max');
    url.searchParams.set('hourly', 'temperature_2m,precipitation,wind_speed_10m');
    url.searchParams.set('timezone', 'America/Sao_Paulo');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data: WeatherResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Format daily data for charts
export function formatChartData(weather: WeatherResponse) {
  return weather.daily.time.map((date, index) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    tempMax: Math.round(weather.daily.temperature_2m_max[index] * 10) / 10,
    tempMin: Math.round(weather.daily.temperature_2m_min[index] * 10) / 10,
    precipitation: Math.round(weather.daily.precipitation_sum[index] * 10) / 10,
    windMax: Math.round(weather.daily.wind_speed_10m_max[index] * 10) / 10,
  }));
}

// Get D-1 (yesterday) data from weather response
export function getD1Data(weather: WeatherResponse) {
  const lastIndex = weather.daily.time.length - 1;
  return {
    tempMax: Math.round(weather.daily.temperature_2m_max[lastIndex] * 10) / 10,
    tempMin: Math.round(weather.daily.temperature_2m_min[lastIndex] * 10) / 10,
    precipitation: Math.round(weather.daily.precipitation_sum[lastIndex] * 10) / 10,
    windMax: Math.round(weather.daily.wind_speed_10m_max[lastIndex] * 10) / 10,
  };
}
