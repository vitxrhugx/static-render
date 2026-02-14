// INMET (Instituto Nacional de Meteorologia) API integration
// Uses edge function proxy to avoid CORS issues

import { supabase } from "@/integrations/supabase/client";

export interface InmetStation {
  CD_ESTACAO: string;
  DC_NOME: string;
  SG_ESTADO: string;
  VL_LATITUDE: number;
  VL_LONGITUDE: number;
  VL_ALTITUDE: number;
  CD_SITUACAO: string;
  TP_ESTACAO: string;
  DT_INICIO_OPERACAO: string;
}

export interface InmetObservation {
  DT_MEDICAO: string;
  HR_MEDICAO: string;
  TEM_MAX: number | null;
  TEM_MIN: number | null;
  TEM_INS: number | null;
  CHUVA: number | null;
  VEN_VEL: number | null;
  VEN_RAJ: number | null;
  UMD_INS: number | null;
  PRE_INS: number | null;
  RAD_GLO: number | null;
}

export interface InmetDailyData {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitation: number | null;
  windMax: number | null;
  humidity: number | null;
  radiation: number | null;
}

// Fetch INMET stations list
export async function getInmetStations(state?: string): Promise<InmetStation[]> {
  try {
    const { data, error } = await supabase.functions.invoke('inmet-proxy', {
      body: { 
        action: 'stations',
        state,
      },
    });

    if (error) {
      console.error('Error fetching INMET stations:', error);
      return [];
    }

    return data?.stations || [];
  } catch (error) {
    console.error('Error fetching INMET stations:', error);
    return [];
  }
}

// Fetch INMET station data for a date range
export async function getInmetStationData(
  stationCode: string,
  startDate: string,
  endDate: string
): Promise<InmetDailyData[]> {
  try {
    const { data, error } = await supabase.functions.invoke('inmet-proxy', {
      body: {
        action: 'station_data',
        stationCode,
        startDate,
        endDate,
      },
    });

    if (error) {
      console.error('Error fetching INMET data:', error);
      return [];
    }

    return data?.data || [];
  } catch (error) {
    console.error('Error fetching INMET data:', error);
    return [];
  }
}

// Find nearest INMET station to coordinates
export async function findNearestInmetStation(
  latitude: number,
  longitude: number
): Promise<InmetStation | null> {
  const stations = await getInmetStations();
  if (stations.length === 0) return null;

  let nearest: InmetStation | null = null;
  let minDistance = Infinity;

  for (const station of stations) {
    if (station.CD_SITUACAO !== 'Operante') continue;
    
    const dist = Math.sqrt(
      Math.pow(station.VL_LATITUDE - latitude, 2) +
      Math.pow(station.VL_LONGITUDE - longitude, 2)
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  }

  return nearest;
}
