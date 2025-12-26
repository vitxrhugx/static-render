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

// Forecast API interfaces
export interface ForecastDailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  weather_code: number[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  daily: ForecastDailyData;
}

export interface ForecastDay {
  date: Date;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipitationProbability: number;
  windMax: number;
  condition: "sunny" | "partly-cloudy" | "cloudy" | "drizzle" | "rain";
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

// Map WMO weather codes to condition types
function mapWeatherCodeToCondition(code: number): ForecastDay["condition"] {
  // WMO Weather interpretation codes
  // 0: Clear sky
  // 1, 2, 3: Mainly clear, partly cloudy, overcast
  // 45, 48: Fog
  // 51, 53, 55: Drizzle
  // 56, 57: Freezing drizzle
  // 61, 63, 65: Rain
  // 66, 67: Freezing rain
  // 71, 73, 75, 77: Snow
  // 80, 81, 82: Rain showers
  // 85, 86: Snow showers
  // 95, 96, 99: Thunderstorm
  
  if (code === 0) return "sunny";
  if (code >= 1 && code <= 2) return "partly-cloudy";
  if (code === 3 || code === 45 || code === 48) return "cloudy";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 99) return "rain";
  
  return "sunny";
}

// Forecast API - Get weather forecast for the next 7 days
export async function getWeatherForecast(
  latitude: number,
  longitude: number
): Promise<ForecastDay[] | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code');
    url.searchParams.set('timezone', 'America/Sao_Paulo');
    url.searchParams.set('forecast_days', '8'); // Today + 7 days

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`);
    }

    const data: ForecastResponse = await response.json();
    
    // Skip today (index 0), return next 7 days
    const forecast: ForecastDay[] = [];
    for (let i = 1; i <= 7 && i < data.daily.time.length; i++) {
      forecast.push({
        date: new Date(data.daily.time[i]),
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipitation: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
        precipitationProbability: data.daily.precipitation_probability_max[i],
        windMax: Math.round(data.daily.wind_speed_10m_max[i]),
        condition: mapWeatherCodeToCondition(data.daily.weather_code[i]),
      });
    }
    
    return forecast;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
}
