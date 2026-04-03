// Unified Weather Data Layer
// Merges Open-Meteo, INMET, CPTEC/INPE, and NASA POWER data
// with fallback, confidence scoring, and divergence detection

import { getHistoricalWeather, formatChartData, getD1Data } from "@/lib/openmeteo";
import { findNearestInmetStation, getInmetStationData, InmetStation, InmetDailyData } from "@/lib/inmet";
import { getNasaPowerData, NasaPowerResult, NasaPowerDailyData } from "@/lib/nasa-power";
import { findCptecCity, getCptecExtendedForecast, CptecForecastDay } from "@/lib/cptec";
import { format, subDays } from "date-fns";

export type DataSource = "open-meteo" | "inmet" | "merged" | "nasa-power" | "cptec";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface SourceInfo {
  source: DataSource;
  confidence: ConfidenceLevel;
  inmetDistance?: number;
  inmetStation?: string;
  hasInmet: boolean;
  hasOpenMeteo: boolean;
  hasNasaPower: boolean;
  hasCptec: boolean;
  activeSources: number;
  divergences: Divergence[];
}

export interface Divergence {
  metric: string;
  label: string;
  openMeteoValue: number;
  inmetValue: number;
  diffPercent: number;
  severity: "low" | "medium" | "high";
}

export interface UnifiedDailyData {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitation: number | null;
  windMax: number | null;
  humidity: number | null;
  solarRadiation: number | null;
  evapotranspiration: number | null;
  sources: {
    tempMax: DataSource;
    tempMin: DataSource;
    precipitation: DataSource;
    windMax: DataSource;
    humidity: DataSource;
  };
}

export interface UnifiedWeatherResult {
  d1: {
    tempMax: number;
    tempMin: number;
    precipitation: number;
    windMax: number;
  } | null;
  chartData: UnifiedDailyData[];
  sourceInfo: SourceInfo;
  inmetStation: InmetStation | null;
  inmetRaw: InmetDailyData[];
  openMeteoRaw: { date: string; tempMax: number; tempMin: number; precipitation: number; windMax: number }[];
  nasaPowerRaw: NasaPowerDailyData[];
  cptecForecast: CptecForecastDay[];
}

// Haversine distance in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Confidence scoring now considers number of active sources
function getConfidence(
  distanceKm: number | undefined,
  hasInmet: boolean,
  hasOpenMeteo: boolean,
  hasNasaPower: boolean,
  hasCptec: boolean
): ConfidenceLevel {
  const sourceCount = [hasInmet, hasOpenMeteo, hasNasaPower, hasCptec].filter(Boolean).length;

  if (sourceCount >= 3 && hasInmet && distanceKm !== undefined && distanceKm <= 30) return "high";
  if (sourceCount >= 3) return "high";
  if (sourceCount >= 2 && hasInmet && distanceKm !== undefined && distanceKm <= 50) return "high";
  if (sourceCount >= 2) return "medium";
  if (hasInmet || hasOpenMeteo) return "medium";
  return "low";
}

// Detect divergences between Open-Meteo and INMET
function detectDivergences(
  openMeteoData: { date: string; tempMax: number; tempMin: number; precipitation: number; windMax: number }[],
  inmetData: InmetDailyData[]
): Divergence[] {
  const divergences: Divergence[] = [];
  const inmetByDate = new Map(inmetData.map(d => [d.date, d]));

  for (const om of openMeteoData) {
    const inmet = inmetByDate.get(om.date);
    if (!inmet) continue;

    const checks = [
      { metric: "tempMax", label: "Temperatura Máxima", omVal: om.tempMax, inVal: inmet.tempMax, thresholdPercent: 15 },
      { metric: "tempMin", label: "Temperatura Mínima", omVal: om.tempMin, inVal: inmet.tempMin, thresholdPercent: 15 },
      { metric: "precipitation", label: "Precipitação", omVal: om.precipitation, inVal: inmet.precipitation, thresholdPercent: 30 },
      { metric: "windMax", label: "Vento Máximo", omVal: om.windMax, inVal: inmet.windMax, thresholdPercent: 25 },
    ];

    for (const check of checks) {
      if (check.inVal === null) continue;
      const avg = (Math.abs(check.omVal) + Math.abs(check.inVal)) / 2;
      if (avg === 0) continue;

      const diff = Math.abs(check.omVal - check.inVal);
      const diffPercent = (diff / avg) * 100;

      if (diffPercent > check.thresholdPercent) {
        divergences.push({
          metric: check.metric,
          label: check.label,
          openMeteoValue: check.omVal,
          inmetValue: check.inVal,
          diffPercent: Math.round(diffPercent),
          severity: diffPercent > check.thresholdPercent * 2 ? "high" : diffPercent > check.thresholdPercent * 1.3 ? "medium" : "low",
        });
      }
    }
  }

  return divergences;
}

// Multi-source merge: prioritize INMET (ground truth) → NASA POWER → Open-Meteo
function mergeValue(
  inmetVal: number | null | undefined,
  openMeteoVal: number | null | undefined,
  nasaPowerVal: number | null | undefined,
  stationDistanceKm: number | undefined
): { value: number | null; source: DataSource } {
  const hasInmet = inmetVal !== null && inmetVal !== undefined;
  const hasOM = openMeteoVal !== null && openMeteoVal !== undefined;
  const hasNasa = nasaPowerVal !== null && nasaPowerVal !== undefined;

  // If INMET station is close, prefer ground truth
  if (hasInmet && stationDistanceKm !== undefined && stationDistanceKm <= 50) {
    return { value: inmetVal, source: "inmet" };
  }

  // If multiple sources, compute weighted average
  const sources: { val: number; weight: number; src: DataSource }[] = [];
  if (hasInmet) sources.push({ val: inmetVal, weight: stationDistanceKm ? Math.max(0.3, 1 - stationDistanceKm / 200) : 0.5, src: "inmet" });
  if (hasOM) sources.push({ val: openMeteoVal, weight: 0.6, src: "open-meteo" });
  if (hasNasa) sources.push({ val: nasaPowerVal, weight: 0.4, src: "nasa-power" });

  if (sources.length >= 2) {
    const totalWeight = sources.reduce((s, x) => s + x.weight, 0);
    const weightedAvg = sources.reduce((s, x) => s + x.val * x.weight, 0) / totalWeight;
    return { value: Math.round(weightedAvg * 10) / 10, source: "merged" };
  }

  if (sources.length === 1) return { value: sources[0].val, source: sources[0].src };
  return { value: null, source: "open-meteo" };
}

// Main unified fetch
export async function getUnifiedWeatherData(
  latitude: number,
  longitude: number,
  locationName?: string,
  locationState?: string
): Promise<UnifiedWeatherResult> {
  // Fetch all 4 sources in parallel
  const [openMeteoResult, inmetStation, nasaPowerResult, cptecCity] = await Promise.all([
    getHistoricalWeather(latitude, longitude),
    findNearestInmetStation(latitude, longitude),
    getNasaPowerData(latitude, longitude, 7),
    locationName ? findCptecCity(locationName, locationState) : Promise.resolve(null),
  ]);

  // Parse Open-Meteo
  const openMeteoChart = openMeteoResult ? formatChartData(openMeteoResult) : [];
  const openMeteoD1 = openMeteoResult ? getD1Data(openMeteoResult) : null;

  // Fetch INMET station data
  let inmetData: InmetDailyData[] = [];
  let stationDistanceKm: number | undefined;

  if (inmetStation) {
    stationDistanceKm = haversineDistance(latitude, longitude, inmetStation.VL_LATITUDE, inmetStation.VL_LONGITUDE);
    const end = format(new Date(), "yyyy-MM-dd");
    const start = format(subDays(new Date(), 7), "yyyy-MM-dd");
    try {
      inmetData = await getInmetStationData(inmetStation.CD_ESTACAO, start, end);
    } catch (e) {
      console.warn("Failed to fetch INMET data:", e);
    }
  }

  // Fetch CPTEC forecast
  let cptecForecast: CptecForecastDay[] = [];
  if (cptecCity) {
    try {
      cptecForecast = await getCptecExtendedForecast(cptecCity.id);
    } catch (e) {
      console.warn("Failed to fetch CPTEC forecast:", e);
    }
  }

  const hasInmet = inmetData.length > 0;
  const hasOpenMeteo = openMeteoChart.length > 0;
  const hasNasaPower = (nasaPowerResult?.dailyData.length ?? 0) > 0;
  const hasCptec = cptecForecast.length > 0;
  const activeSources = [hasInmet, hasOpenMeteo, hasNasaPower, hasCptec].filter(Boolean).length;

  // Detect divergences
  const divergences = detectDivergences(openMeteoChart, inmetData);

  // Build source info
  const sourceInfo: SourceInfo = {
    source: activeSources >= 2 ? "merged" : hasInmet ? "inmet" : hasOpenMeteo ? "open-meteo" : hasNasaPower ? "nasa-power" : "open-meteo",
    confidence: getConfidence(stationDistanceKm, hasInmet, hasOpenMeteo, hasNasaPower, hasCptec),
    inmetDistance: stationDistanceKm ? Math.round(stationDistanceKm * 10) / 10 : undefined,
    inmetStation: inmetStation ? `${inmetStation.DC_NOME} (${inmetStation.SG_ESTADO})` : undefined,
    hasInmet,
    hasOpenMeteo,
    hasNasaPower,
    hasCptec,
    activeSources,
    divergences,
  };

  // Build NASA POWER lookup by short date (dd/MM)
  const nasaByShortDate = new Map<string, NasaPowerDailyData>();
  if (nasaPowerResult) {
    for (const d of nasaPowerResult.dailyData) {
      const parts = d.date.split("-");
      if (parts.length === 3) {
        nasaByShortDate.set(`${parts[2]}/${parts[1]}`, d);
      }
    }
  }

  // Build unified daily data
  const allDates = new Set<string>();
  openMeteoChart.forEach(d => allDates.add(d.date));
  inmetData.forEach(d => {
    const parts = d.date.split("-");
    if (parts.length === 3) allDates.add(`${parts[2]}/${parts[1]}`);
  });
  if (nasaPowerResult) {
    nasaPowerResult.dailyData.forEach(d => {
      const parts = d.date.split("-");
      if (parts.length === 3) allDates.add(`${parts[2]}/${parts[1]}`);
    });
  }

  const inmetByShortDate = new Map<string, InmetDailyData>();
  for (const d of inmetData) {
    const parts = d.date.split("-");
    if (parts.length === 3) inmetByShortDate.set(`${parts[2]}/${parts[1]}`, d);
  }

  const omByDate = new Map(openMeteoChart.map(d => [d.date, d]));

  const chartData: UnifiedDailyData[] = [];
  for (const date of Array.from(allDates).sort()) {
    const om = omByDate.get(date);
    const inmet = inmetByShortDate.get(date);
    const nasa = nasaByShortDate.get(date);

    const tempMax = mergeValue(inmet?.tempMax, om?.tempMax, nasa?.tempMax, stationDistanceKm);
    const tempMin = mergeValue(inmet?.tempMin, om?.tempMin, nasa?.tempMin, stationDistanceKm);
    const precipitation = mergeValue(inmet?.precipitation, om?.precipitation, nasa?.precipitation, stationDistanceKm);
    const windMax = mergeValue(inmet?.windMax, om?.windMax, nasa?.windSpeed ? nasa.windSpeed * 3.6 : undefined, stationDistanceKm);
    const humidity = mergeValue(inmet?.humidity, undefined, nasa?.humidity, stationDistanceKm);

    chartData.push({
      date,
      tempMax: tempMax.value,
      tempMin: tempMin.value,
      precipitation: precipitation.value,
      windMax: windMax.value,
      humidity: humidity.value,
      solarRadiation: nasa?.solarRadiation ?? null,
      evapotranspiration: nasa?.evapotranspiration ?? null,
      sources: {
        tempMax: tempMax.source,
        tempMin: tempMin.source,
        precipitation: precipitation.source,
        windMax: windMax.source,
        humidity: humidity.source,
      },
    });
  }

  // Build unified D-1
  let d1 = openMeteoD1;
  const latestInmet = inmetData.length > 0 ? inmetData[inmetData.length - 1] : null;
  const latestNasa = nasaPowerResult?.dailyData.length ? nasaPowerResult.dailyData[nasaPowerResult.dailyData.length - 1] : null;

  if (d1) {
    const tMax = mergeValue(latestInmet?.tempMax, d1.tempMax, latestNasa?.tempMax, stationDistanceKm);
    const tMin = mergeValue(latestInmet?.tempMin, d1.tempMin, latestNasa?.tempMin, stationDistanceKm);
    const precip = mergeValue(latestInmet?.precipitation, d1.precipitation, latestNasa?.precipitation, stationDistanceKm);
    const wind = mergeValue(latestInmet?.windMax, d1.windMax, latestNasa?.windSpeed ? latestNasa.windSpeed * 3.6 : undefined, stationDistanceKm);
    d1 = {
      tempMax: tMax.value ?? d1.tempMax,
      tempMin: tMin.value ?? d1.tempMin,
      precipitation: precip.value ?? d1.precipitation,
      windMax: wind.value ?? d1.windMax,
    };
  } else if (latestNasa) {
    // Fallback to NASA POWER if Open-Meteo failed
    d1 = {
      tempMax: latestNasa.tempMax ?? 0,
      tempMin: latestNasa.tempMin ?? 0,
      precipitation: latestNasa.precipitation ?? 0,
      windMax: latestNasa.windSpeed ? latestNasa.windSpeed * 3.6 : 0,
    };
  }

  return {
    d1,
    chartData,
    sourceInfo,
    inmetStation,
    inmetRaw: inmetData,
    openMeteoRaw: openMeteoChart,
    nasaPowerRaw: nasaPowerResult?.dailyData ?? [],
    cptecForecast,
  };
}
