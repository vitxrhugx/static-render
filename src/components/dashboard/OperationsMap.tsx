import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Droplets, Wind, Thermometer } from 'lucide-react';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface OperationPoint {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  weather: {
    precipitation: number;
    wind_speed: number;
    temperature: number;
  };
  validation: number;
  status: 'normal' | 'alert' | 'critical';
}

interface OperationsMapProps {
  operations?: OperationPoint[];
  selectedLocation?: { latitude: number; longitude: number } | null;
}

// Demo data for telecom operations
const demoOperations: OperationPoint[] = [
  {
    id: 'op-001',
    name: 'São Paulo Centro',
    region: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    scheduled: 25,
    completed: 2,
    cancelled: 23,
    weather: { precipitation: 18.4, wind_speed: 28, temperature: 21 },
    validation: 0.78,
    status: 'critical',
  },
  {
    id: 'op-002',
    name: 'Rio de Janeiro Sul',
    region: 'Rio de Janeiro',
    latitude: -22.9068,
    longitude: -43.1729,
    scheduled: 20,
    completed: 5,
    cancelled: 15,
    weather: { precipitation: 12.2, wind_speed: 22, temperature: 26 },
    validation: 0.67,
    status: 'alert',
  },
  {
    id: 'op-003',
    name: 'Belo Horizonte',
    region: 'Minas Gerais',
    latitude: -19.9167,
    longitude: -43.9345,
    scheduled: 15,
    completed: 7,
    cancelled: 8,
    weather: { precipitation: 2.1, wind_speed: 12, temperature: 24 },
    validation: 0.25,
    status: 'normal',
  },
  {
    id: 'op-004',
    name: 'Brasília',
    region: 'Distrito Federal',
    latitude: -15.7942,
    longitude: -47.8822,
    scheduled: 18,
    completed: 15,
    cancelled: 3,
    weather: { precipitation: 0.5, wind_speed: 8, temperature: 28 },
    validation: 0.15,
    status: 'normal',
  },
  {
    id: 'op-005',
    name: 'Salvador',
    region: 'Bahia',
    latitude: -12.9714,
    longitude: -38.5014,
    scheduled: 12,
    completed: 4,
    cancelled: 8,
    weather: { precipitation: 8.5, wind_speed: 35, temperature: 29 },
    validation: 0.55,
    status: 'alert',
  },
  {
    id: 'op-006',
    name: 'Curitiba',
    region: 'Paraná',
    latitude: -25.4284,
    longitude: -49.2733,
    scheduled: 16,
    completed: 14,
    cancelled: 2,
    weather: { precipitation: 1.2, wind_speed: 10, temperature: 18 },
    validation: 0.12,
    status: 'normal',
  },
  {
    id: 'op-007',
    name: 'Porto Alegre',
    region: 'Rio Grande do Sul',
    latitude: -30.0346,
    longitude: -51.2177,
    scheduled: 14,
    completed: 6,
    cancelled: 8,
    weather: { precipitation: 15.3, wind_speed: 42, temperature: 16 },
    validation: 0.72,
    status: 'critical',
  },
  {
    id: 'op-008',
    name: 'Recife',
    region: 'Pernambuco',
    latitude: -8.0476,
    longitude: -34.877,
    scheduled: 10,
    completed: 8,
    cancelled: 2,
    weather: { precipitation: 3.2, wind_speed: 18, temperature: 30 },
    validation: 0.20,
    status: 'normal',
  },
  {
    id: 'op-009',
    name: 'Fortaleza',
    region: 'Ceará',
    latitude: -3.7172,
    longitude: -38.5433,
    scheduled: 11,
    completed: 3,
    cancelled: 8,
    weather: { precipitation: 22.1, wind_speed: 38, temperature: 28 },
    validation: 0.82,
    status: 'critical',
  },
  {
    id: 'op-010',
    name: 'Campinas',
    region: 'São Paulo',
    latitude: -22.9099,
    longitude: -47.0626,
    scheduled: 12,
    completed: 9,
    cancelled: 3,
    weather: { precipitation: 5.5, wind_speed: 15, temperature: 23 },
    validation: 0.35,
    status: 'alert',
  },
];

const getStatusColor = (status: OperationPoint['status']) => {
  switch (status) {
    case 'normal':
      return 'hsl(142, 76%, 36%)'; // Green
    case 'alert':
      return 'hsl(38, 100%, 50%)'; // Yellow/Orange
    case 'critical':
      return 'hsl(0, 84%, 60%)'; // Red
    default:
      return 'hsl(215, 20%, 65%)';
  }
};

const getStatusLabel = (status: OperationPoint['status']) => {
  switch (status) {
    case 'normal':
      return 'Normal';
    case 'alert':
      return 'Alerta';
    case 'critical':
      return 'Crítico';
    default:
      return status;
  }
};

const createCustomIcon = (status: OperationPoint['status']) => {
  const color = getStatusColor(status);
  const svg = `
    <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24C32 7.163 24.837 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="14" r="6" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

export function OperationsMap({ operations = demoOperations, selectedLocation }: OperationsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [hoveredOperation, setHoveredOperation] = useState<OperationPoint | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Brazil
    const map = L.map(mapRef.current, {
      center: [-14.235, -51.9253],
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add dark tile layer for better contrast
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Add operation markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each operation
    operations.forEach((op) => {
      const marker = L.marker([op.latitude, op.longitude], {
        icon: createCustomIcon(op.status),
      });

      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 8px 0;">${op.name}</h3>
          <p style="color: #888; font-size: 12px; margin: 0 0 12px 0;">${op.region}</p>
          <div style="display: grid; gap: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span>🌧️ Precipitação</span>
              <strong>${op.weather.precipitation}mm</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>💨 Vento</span>
              <strong>${op.weather.wind_speed}km/h</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>🌡️ Temperatura</span>
              <strong>${op.weather.temperature}°C</strong>
            </div>
            <hr style="border: none; border-top: 1px solid #333; margin: 4px 0;">
            <div style="display: flex; justify-content: space-between;">
              <span>Cancelamentos</span>
              <strong style="color: ${getStatusColor(op.status)};">${op.cancelled}/${op.scheduled}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Validação</span>
              <strong>${Math.round(op.validation * 100)}%</strong>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-popup',
      });

      marker.on('mouseover', () => setHoveredOperation(op));
      marker.on('mouseout', () => setHoveredOperation(null));

      marker.addTo(map);
    });
  }, [operations]);

  // Pan to selected location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocation) return;

    map.setView([selectedLocation.latitude, selectedLocation.longitude], 8, {
      animate: true,
    });
  }, [selectedLocation]);

  // Calculate summary stats
  const totalCancelled = operations.reduce((sum, op) => sum + op.cancelled, 0);
  const totalScheduled = operations.reduce((sum, op) => sum + op.scheduled, 0);
  const criticalCount = operations.filter((op) => op.status === 'critical').length;
  const alertCount = operations.filter((op) => op.status === 'alert').length;

  return (
    <Card className="bg-card shadow-card overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <MapPin className="w-5 h-5 text-primary" />
            Mapa de Operações
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Normal: {operations.filter((op) => op.status === 'normal').length}
            </Badge>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              Alerta: {alertCount}
            </Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              Crítico: {criticalCount}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        {/* Map Container */}
        <div ref={mapRef} className="h-[400px] w-full" style={{ background: '#1a1a2e' }} />

        {/* Hover Info Panel */}
        {hoveredOperation && (
          <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-[1000] min-w-[240px] border border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">{hoveredOperation.name}</h4>
              <Badge
                variant="outline"
                className={
                  hoveredOperation.status === 'critical'
                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                    : hoveredOperation.status === 'alert'
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-success/10 text-success border-success/20'
                }
              >
                {getStatusLabel(hoveredOperation.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{hoveredOperation.region}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Droplets className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Chuva</p>
                <p className="text-sm font-semibold">{hoveredOperation.weather.precipitation}mm</p>
              </div>
              <div>
                <Wind className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Vento</p>
                <p className="text-sm font-semibold">{hoveredOperation.weather.wind_speed}km/h</p>
              </div>
              <div>
                <Thermometer className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Temp</p>
                <p className="text-sm font-semibold">{hoveredOperation.weather.temperature}°C</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Bar */}
        <div className="bg-muted/50 border-t border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-muted-foreground">Total Operações:</span>{' '}
                <span className="font-semibold">{operations.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cancelamentos:</span>{' '}
                <span className="font-semibold text-destructive">
                  {totalCancelled}/{totalScheduled}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Taxa Impacto:</span>{' '}
                <span className="font-semibold">
                  {Math.round((totalCancelled / totalScheduled) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-success" />
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-warning" />
                <span>Alerta</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-destructive" />
                <span>Crítico</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <style>{`
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: hsl(222, 47%, 11%);
          color: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }
        .custom-popup .leaflet-popup-tip {
          background: hsl(222, 47%, 11%);
        }
        .leaflet-control-zoom a {
          background: hsl(222, 47%, 11%) !important;
          color: white !important;
          border-color: hsl(217, 33%, 17%) !important;
        }
        .leaflet-control-zoom a:hover {
          background: hsl(217, 33%, 17%) !important;
        }
      `}</style>
    </Card>
  );
}
