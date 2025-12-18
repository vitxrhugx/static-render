import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { WeatherCards } from "@/components/dashboard/WeatherCards";
import { TemperatureChart } from "@/components/dashboard/TemperatureChart";
import { PrecipitationChart } from "@/components/dashboard/PrecipitationChart";
import { WindChart } from "@/components/dashboard/WindChart";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Upload, FileSpreadsheet } from "lucide-react";

interface Location {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

// Demo data
const weatherData = {
  tempMax: 32,
  tempMin: 21,
  precipitation: 12.4,
  windMax: 28,
};

const chartData = [
  { date: "11/12", tempMax: 30, tempMin: 19, precipitation: 0, windMax: 15 },
  { date: "12/12", tempMax: 31, tempMin: 20, precipitation: 2.5, windMax: 18 },
  { date: "13/12", tempMax: 28, tempMin: 18, precipitation: 15.2, windMax: 32 },
  { date: "14/12", tempMax: 27, tempMin: 19, precipitation: 8.1, windMax: 25 },
  { date: "15/12", tempMax: 29, tempMin: 20, precipitation: 0.5, windMax: 12 },
  { date: "16/12", tempMax: 31, tempMin: 21, precipitation: 0, windMax: 14 },
  { date: "17/12", tempMax: 32, tempMin: 21, precipitation: 12.4, windMax: 28 },
];

export default function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>({
    id: "1",
    name: "São Paulo",
    state: "SP",
    latitude: -23.5475,
    longitude: -46.6361,
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />
      
      <div className="flex-1 flex overflow-hidden">
        <DashboardSidebar 
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
        />
        
        <main className="flex-1 overflow-auto p-6">
          {selectedLocation ? (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Location Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold">
                    {selectedLocation.name}, {selectedLocation.state}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    Últimos 7 dias
                  </Button>
                </div>
              </div>

              {/* D-1 Cards */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Dados D-1 (Ontem)
                </h2>
                <WeatherCards data={weatherData} />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TemperatureChart data={chartData} />
                <PrecipitationChart data={chartData} />
              </div>

              {/* Wind Chart */}
              <WindChart data={chartData} />

              {/* Operational Data Section */}
              <div className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                    Meus Dados Operacionais
                  </h3>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </Button>
                </div>
                <div className="text-center py-12 text-muted-foreground">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhum dado importado ainda</p>
                  <p className="text-xs mt-1">Importe um arquivo CSV para correlacionar com dados climáticos</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-display font-semibold mb-2">Selecione uma localidade</h2>
                <p className="text-sm">Use a busca na barra lateral para encontrar e salvar localidades</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
