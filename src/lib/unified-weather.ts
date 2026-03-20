// Unified Weather Data Layer
// Merges Open-Meteo (model/satellite) and INMET (ground station) data
// with fallback, confidence scoring, and divergence detection

import { getHistoricalWeather, formatChartData, getD1Data } from "@/lib/openmeteo";
import { findNearestInmetStation, getInmetStationData, InmetStation, InmetDailyData } from "@/lib/inmet";
import { format, subDays } from "date-fns";

export type DataSource = "open-meteo" | "inmet" | "merged";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface SourceInfo {
  source: DataSource;
  confidence: ConfidenceLevel;
  inmetDistance?: number; // km
  inmetStation?: string;
  hasInmet: boolean;
  hasOpenMeteo: boolean;
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
  // Source tracking per metric
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
}

// Calculate distance between two coordinates in km (Haversine)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Determine confidence based on INMET station distance
function getConfidence(distanceKm: number | undefined, hasInmet: boolean, hasOpenMeteo: boolean): ConfidenceLevel {
  if (hasInmet && hasOpenMeteo) {
    if (distanceKm !== undefined && distanceKm <= 30) return "high";
    if (distanceKm !== undefined && distanceKm <= 80) return "medium";
    return "medium";
  }
  if (hasInmet) return "medium";
  if (hasOpenMeteo) return "low";
  return "low";
}

// Detect divergences between the two sources
function detectDivergences(
  openMeteoData: { date: string; tempMax: number; tempMin: number; precipitation: number; windMax: number }[],
  inmetData: InmetDailyData[]
): Divergence[] {
  const divergences: Divergence[] = [];
  
  const inmetByDate = new Map(inmetData.map(d => [d.date, d]));
  
  for (const om of openMeteoData) {
    const inmet = inmetByDate.get(om.date);
    if (!inmet) continue;

    const checks: { metric: string; label: string; omVal: number; inVal: number | null; thresholdPercent: number }[] = [
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

// Merge a single metric: prefer INMET when available and station is close, otherwise Open-Meteo
function mergeValue(
  inmetVal: number | null | undefined,
  openMeteoVal: number | null | undefined,
  stationDistanceKm: number | undefined
): { value: number | null; source: DataSource } {
  const hasInmet = inmetVal !== null && inmetVal !== undefined;
  const hasOM = openMeteoVal !== null && openMeteoVal !== undefined;

  if (hasInmet && hasOM) {
    // If station is close (<50km), prefer INMET (ground truth)
    if (stationDistanceKm !== undefined && stationDistanceKm <= 50) {
      return { value: inmetVal, source: "inmet" };
    }
    // If station is far, average both
    return { value: Math.round(((inmetVal + openMeteoVal) / 2) * 10) / 10, source: "merged" };
  }
  if (hasInmet) return { value: inmetVal, source: "inmet" };
  if (hasOM) return { value: openMeteoVal, source: "open-meteo" };
  return { value: null, source: "open-meteo" };
}

// Main unified fetch function
export async function getUnifiedWeatherData(
  latitude: number,
  longitude: number
): Promise<UnifiedWeatherResult> {
  // Fetch both sources in parallel
  const [openMeteoResult, inmetStation] = await Promise.all([
    getHistoricalWeather(latitude, longitude),
    findNearestInmetStation(latitude, longitude),
  ]);

  // Parse Open-Meteo data
  const openMeteoChart = openMeteoResult ? formatChartData(openMeteoResult) : [];
  const openMeteoD1 = openMeteoResult ? getD1Data(openMeteoResult) : null;

  // Fetch INMET station data if found
  let inmetData: InmetDailyData[] = [];
  let stationDistanceKm: number | undefined;

  if (inmetStation) {
    stationDistanceKm = haversineDistance(
      latitude, longitude,
      inmetStation.VL_LATITUDE, inmetStation.VL_LONGITUDE
    );

    const end = format(new Date(), "yyyy-MM-dd");
    const start = format(subDays(new Date(), 7), "yyyy-MM-dd");

    try {
      inmetData = await getInmetStationData(inmetStation.CD_ESTACAO, start, end);
    } catch (e) {
      console.warn("Failed to fetch INMET data:", e);
    }
  }

  const hasInmet = inmetData.length > 0;
  const hasOpenMeteo = openMeteoChart.length > 0;

  // Detect divergences
  const divergences = detectDivergences(openMeteoChart, inmetData);

  // Build source info
  const sourceInfo: SourceInfo = {
    source: hasInmet && hasOpenMeteo ? "merged" : hasInmet ? "inmet" : "open-meteo",
    confidence: getConfidence(stationDistanceKm, hasInmet, hasOpenMeteo),
    inmetDistance: stationDistanceKm ? Math.round(stationDistanceKm * 10) / 10 : undefined,
    inmetStation: inmetStation ? `${inmetStation.DC_NOME} (${inmetStation.SG_ESTADO})` : undefined,
    hasInmet,
    hasOpenMeteo,
    divergences,
  };

  // Build unified daily data
  const allDates = new Set<string>();
  openMeteoChart.forEach(d => allDates.add(d.date));
  inmetData.forEach(d => {
    // Convert INMET date format (yyyy-MM-dd) to chart format (dd/MM)
    const parts = d.date.split("-");
    if (parts.length === 3) {
      allDates.add(`${parts[2]}/${parts[1]}`);
    }
  });

  // Create lookup for INMET data by dd/MM format
  const inmetByShortDate = new Map<string, InmetDailyData>();
  for (const d of inmetData) {
    const parts = d.date.split("-");
    if (parts.length === 3) {
      inmetByShortDate.set(`${parts[2]}/${parts[1]}`, d);
    }
  }

  const omByDate = new Map(openMeteoChart.map(d => [d.date, d]));

  const chartData: UnifiedDailyData[] = [];
  for (const date of Array.from(allDates).sort()) {
    const om = omByDate.get(date);
    const inmet = inmetByShortDate.get(date);

    const tempMax = mergeValue(inmet?.tempMax, om?.tempMax, stationDistanceKm);
    const tempMin = mergeValue(inmet?.tempMin, om?.tempMin, stationDistanceKm);
    const precipitation = mergeValue(inmet?.precipitation, om?.precipitation, stationDistanceKm);
    const windMax = mergeValue(inmet?.windMax, om?.windMax, stationDistanceKm);
    const humidity = mergeValue(inmet?.humidity, undefined, stationDistanceKm);

    chartData.push({
      date,
      tempMax: tempMax.value,
      tempMin: tempMin.value,
      precipitation: precipitation.value,
      windMax: windMax.value,
      humidity: humidity.value,
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
  if (inmetData.length > 0) {
    const latestInmet = inmetData[inmetData.length - 1];
    if (d1) {
      const tMax = mergeValue(latestInmet.tempMax, d1.tempMax, stationDistanceKm);
      const tMin = mergeValue(latestInmet.tempMin, d1.tempMin, stationDistanceKm);
      const precip = mergeValue(latestInmet.precipitation, d1.precipitation, stationDistanceKm);
      const wind = mergeValue(latestInmet.windMax, d1.windMax, stationDistanceKm);
      d1 = {
        tempMax: tMax.value ?? d1.tempMax,
        tempMin: tMin.value ?? d1.tempMin,
        precipitation: precip.value ?? d1.precipitation,
        windMax: wind.value ?? d1.windMax,
      };
    }
  }

  return {
    d1,
    chartData,
    sourceInfo,
    inmetStation: inmetStation,
    inmetRaw: inmetData,
    openMeteoRaw: openMeteoChart,
  };
}
