// NASA POWER API Client
// Prediction of Worldwide Energy Resources
// Free global climate data: https://power.larc.nasa.gov/

import { format, subDays } from "date-fns";

export interface NasaPowerDailyData {
  date: string; // yyyy-MM-dd
  temperature2m: number | null; // °C - Average temp at 2m
  tempMax: number | null; // °C
  tempMin: number | null; // °C
  precipitation: number | null; // mm/day
  humidity: number | null; // % - Relative humidity at 2m
  windSpeed: number | null; // m/s at 10m
  solarRadiation: number | null; // kWh/m²/day - All Sky Surface Shortwave Downward Irradiance
  evapotranspiration: number | null; // mm/day - Reference evapotranspiration (estimated)
  surfacePressure: number | null; // kPa
  dewPoint: number | null; // °C
}

export interface NasaPowerResult {
  latitude: number;
  longitude: number;
  dailyData: NasaPowerDailyData[];
  parameters: string[];
}

// NASA POWER parameter codes
const PARAMETERS = [
  "T2M",           // Temperature at 2 Meters (°C)
  "T2M_MAX",       // Temperature at 2 Meters Maximum (°C)
  "T2M_MIN",       // Temperature at 2 Meters Minimum (°C)
  "PRECTOTCORR",   // Precipitation Corrected (mm/day)
  "RH2M",          // Relative Humidity at 2 Meters (%)
  "WS10M",         // Wind Speed at 10 Meters (m/s)
  "ALLSKY_SFC_SW_DWN", // All Sky Surface Shortwave Downward Irradiance (kWh/m²/day)
  "PS",            // Surface Pressure (kPa)
  "T2MDEW",        // Dew/Frost Point at 2 Meters (°C)
].join(",");

// Fetch daily data from NASA POWER API
export async function getNasaPowerData(
  latitude: number,
  longitude: number,
  days: number = 7
): Promise<NasaPowerResult | null> {
  try {
    const endDate = subDays(new Date(), 2); // NASA POWER has ~2 day lag
    const startDate = subDays(endDate, days);

    const startStr = format(startDate, "yyyyMMdd");
    const endStr = format(endDate, "yyyyMMdd");

    const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
    url.searchParams.set("parameters", PARAMETERS);
    url.searchParams.set("community", "AG"); // Agroclimatology community
    url.searchParams.set("longitude", longitude.toFixed(4));
    url.searchParams.set("latitude", latitude.toFixed(4));
    url.searchParams.set("start", startStr);
    url.searchParams.set("end", endStr);
    url.searchParams.set("format", "JSON");

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`NASA POWER API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.properties?.parameter) {
      console.warn("NASA POWER: No parameter data in response");
      return null;
    }

    const params = data.properties.parameter;
    const dates = Object.keys(params.T2M || {});

    const dailyData: NasaPowerDailyData[] = dates.map((dateKey) => {
      // Convert yyyyMMdd to yyyy-MM-dd
      const formattedDate = `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`;

      const parseVal = (paramName: string): number | null => {
        const val = params[paramName]?.[dateKey];
        // NASA POWER uses -999 for missing data
        return val !== undefined && val !== -999 ? val : null;
      };

      return {
        date: formattedDate,
        temperature2m: parseVal("T2M"),
        tempMax: parseVal("T2M_MAX"),
        tempMin: parseVal("T2M_MIN"),
        precipitation: parseVal("PRECTOTCORR"),
        humidity: parseVal("RH2M"),
        windSpeed: parseVal("WS10M"),
        solarRadiation: parseVal("ALLSKY_SFC_SW_DWN"),
        evapotranspiration: estimateET0(parseVal("T2M_MAX"), parseVal("T2M_MIN"), parseVal("ALLSKY_SFC_SW_DWN"), latitude),
        surfacePressure: parseVal("PS"),
        dewPoint: parseVal("T2MDEW"),
      };
    });

    return {
      latitude: data.geometry?.coordinates?.[1] ?? latitude,
      longitude: data.geometry?.coordinates?.[0] ?? longitude,
      dailyData: dailyData.filter((d) => d.temperature2m !== null),
      parameters: Object.keys(params),
    };
  } catch (e) {
    console.warn("NASA POWER fetch failed:", e);
    return null;
  }
}

// Simple Hargreaves ET0 estimation (mm/day)
// Uses temperature and solar radiation
function estimateET0(
  tempMax: number | null,
  tempMin: number | null,
  solarRad: number | null,
  latitude: number
): number | null {
  if (tempMax === null || tempMin === null || solarRad === null) return null;

  const tMean = (tempMax + tempMin) / 2;
  const tRange = tempMax - tempMin;
  if (tRange <= 0) return null;

  // Hargreaves-Samani equation simplified
  // ET0 = 0.0023 * (Tmean + 17.8) * √(Trange) * Ra
  // Ra approximated from solar radiation (converting kWh/m²/day to MJ/m²/day)
  const raMJ = solarRad * 3.6; // kWh to MJ

  const et0 = 0.0023 * (tMean + 17.8) * Math.sqrt(tRange) * (raMJ / 2.45);
  return Math.round(et0 * 100) / 100;
}

// Get latest available day of data
export function getNasaPowerLatest(result: NasaPowerResult): NasaPowerDailyData | null {
  if (result.dailyData.length === 0) return null;
  return result.dailyData[result.dailyData.length - 1];
}
