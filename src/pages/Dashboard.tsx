import { useState, useEffect, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar, Location } from "@/components/dashboard/DashboardSidebar";
import { DashboardFilters, FilterState, defaultFilters } from "@/components/dashboard/DashboardFilters";
import { WeatherCards } from "@/components/dashboard/WeatherCards";
import { TemperatureChart } from "@/components/dashboard/TemperatureChart";
import { PrecipitationChart } from "@/components/dashboard/PrecipitationChart";
import { WindChart } from "@/components/dashboard/WindChart";
import { OperationsMap } from "@/components/dashboard/OperationsMap";
import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs";
import { OccurrencesTable } from "@/components/dashboard/OccurrencesTable";
import { WeatherForecast } from "@/components/dashboard/WeatherForecast";
import { WeatherAlerts } from "@/components/dashboard/WeatherAlerts";
import { Button } from "@/components/ui/button";
import { MapPin, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { getHistoricalWeather, formatChartData, getD1Data, getWeatherForecast, ForecastDay } from "@/lib/openmeteo";

interface WeatherData {
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windMax: number;
}

interface ChartDataPoint {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windMax: number;
}

export default function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>({
    id: "1",
    name: "São Paulo",
    state: "SP",
    latitude: -23.5475,
    longitude: -46.6361,
  });

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [forecastData, setForecastData] = useState<ForecastDay[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather data when location changes
  useEffect(() => {
    async function fetchWeatherData() {
      if (!selectedLocation) {
        setWeatherData(null);
        setChartData([]);
        setForecastData(null);
        return;
      }

      setIsLoading(true);
      setIsForecastLoading(true);
      setError(null);

      // Fetch historical and forecast data in parallel
      const [weather, forecast] = await Promise.all([
        getHistoricalWeather(selectedLocation.latitude, selectedLocation.longitude),
        getWeatherForecast(selectedLocation.latitude, selectedLocation.longitude),
      ]);

      if (weather) {
        setWeatherData(getD1Data(weather));
        setChartData(formatChartData(weather));
      } else {
        setError("Não foi possível carregar os dados meteorológicos");
      }

      setForecastData(forecast);
      setIsLoading(false);
      setIsForecastLoading(false);
    }

    fetchWeatherData();
  }, [selectedLocation]);

  // Filter forecast data based on alert severity filters
  const filteredForecastData = useMemo(() => {
    return forecastData;
  }, [forecastData]);

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
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold">
                      {selectedLocation.name}{selectedLocation.state ? `, ${selectedLocation.state}` : ''}
                    </h1>
                  </div>
                </div>
                
                {/* Filters Bar */}
                <DashboardFilters filters={filters} onFiltersChange={setFilters} />
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Carregando dados...</span>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              )}

              {/* Weather Data */}
              {!isLoading && !error && weatherData && (
                <>
                  {/* Weather Alerts */}
                  <WeatherAlerts 
                    forecastData={filteredForecastData} 
                    severityFilter={filters.alertSeverity}
                  />

                  {/* Executive KPIs */}
                  <ExecutiveKPIs />

                  {/* D-1 Cards */}
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Dados D-1 (Ontem)
                    </h2>
                    <WeatherCards data={weatherData} />
                  </div>

                  {/* Weather Forecast D+1 to D+7 */}
                  <WeatherForecast data={filteredForecastData} isLoading={isForecastLoading} />

                  {/* Operations Map */}
                  <OperationsMap selectedLocation={selectedLocation} />

                  {/* Charts Grid - Conditionally render based on metrics filter */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filters.metrics.temperature && <TemperatureChart data={chartData} />}
                    {filters.metrics.precipitation && <PrecipitationChart data={chartData} />}
                  </div>

                  {/* Wind Chart */}
                  {filters.metrics.wind && <WindChart data={chartData} />}

                  {/* Occurrences Table */}
                  <OccurrencesTable />
                </>
              )}

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
