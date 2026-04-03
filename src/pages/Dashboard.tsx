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
import { WeatherCalendar } from "@/components/dashboard/WeatherCalendar";
import { WeatherCorrelationChart } from "@/components/dashboard/WeatherCorrelationChart";
import { DataImportWizard } from "@/components/organization/DataImportWizard";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Upload, FileSpreadsheet, Loader2, Calendar } from "lucide-react";
import { getWeatherForecast, ForecastDay } from "@/lib/openmeteo";
import { getUnifiedWeatherData, UnifiedWeatherResult } from "@/lib/unified-weather";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/hooks/use-organization";
import { useOperationalData } from "@/hooks/use-operational-data";
import { useKPICalculator } from "@/hooks/use-kpi-calculator";
import { WeatherSourceBadge } from "@/components/dashboard/WeatherSourceBadge";
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
  const { organization } = useOrganization();
  const { data: operationalData, fetchData: fetchOperationalData, importBatch, isLoading: isOperationalLoading } = useOperationalData(organization?.id);
  const { kpis, hasData: hasOperationalData } = useKPICalculator(operationalData);
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [forecastData, setForecastData] = useState<ForecastDay[] | null>(null);
  const [unifiedResult, setUnifiedResult] = useState<UnifiedWeatherResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch operational data based on filter date range
  useEffect(() => {
    if (organization?.id) {
      fetchOperationalData(filters.dateRange.from, filters.dateRange.to);
    }
  }, [organization?.id, filters.dateRange.from, filters.dateRange.to, fetchOperationalData]);

  // Handle CSV import
  const handleImportData = async (data: Record<string, string | number>[]) => {
    const records = data.map(row => ({
      date: new Date(row.date as string),
      scheduledOperations: Number(row.scheduled) || 0,
      completedOperations: Number(row.completed) || 0,
      cancelledOperations: Number(row.cancelled) || 0,
      cancellationReason: row.reason as string || undefined,
      locationId: row.location as string || '',
      weatherImpact: (row.reason as string)?.toLowerCase().includes('chuva') || 
                     (row.reason as string)?.toLowerCase().includes('clima') ||
                     (row.reason as string)?.toLowerCase().includes('tempo') ||
                     (row.reason as string)?.toLowerCase().includes('tempestade') ||
                     false,
      customData: {},
    }));

    const success = await importBatch(records);
    if (success) {
      setIsImportDialogOpen(false);
    }
  };
  // Fetch weather data when location changes
  useEffect(() => {
    async function fetchWeatherData() {
      if (!selectedLocation) {
        setWeatherData(null);
        setChartData([]);
        setForecastData(null);
        setUnifiedResult(null);
        return;
      }

      setIsLoading(true);
      setIsForecastLoading(true);
      setError(null);

      // Fetch unified weather data and forecast in parallel
      const [unified, forecast] = await Promise.all([
        getUnifiedWeatherData(
          selectedLocation.latitude,
          selectedLocation.longitude,
          selectedLocation.name,
          selectedLocation.state
        ),
        getWeatherForecast(selectedLocation.latitude, selectedLocation.longitude),
      ]);

      setUnifiedResult(unified);

      if (unified.d1) {
        setWeatherData(unified.d1);
        // Convert unified chart data to the format expected by charts
        setChartData(unified.chartData.map(d => ({
          date: d.date,
          tempMax: d.tempMax ?? 0,
          tempMin: d.tempMin ?? 0,
          precipitation: d.precipitation ?? 0,
          windMax: d.windMax ?? 0,
        })));
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
      <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex-1 flex overflow-hidden">
        <DashboardSidebar 
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {selectedLocation ? (
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
              {/* Location Header */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                      </span>
                      {selectedLocation.address && (
                        <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                          — {selectedLocation.address}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold">
                      {selectedLocation.name}{selectedLocation.state ? `, ${selectedLocation.state}` : ''}
                    </h1>
                    {/* Weather Sources Indicator */}
                    {unifiedResult && (
                      <div className="mt-2">
                        <WeatherSourceBadge sourceInfo={unifiedResult.sourceInfo} />
                      </div>
                    )}
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
                  {/* Weather Alerts - Using organization thresholds */}
                  <WeatherAlerts 
                    forecastData={filteredForecastData} 
                    severityFilter={filters.alertSeverity}
                    thresholds={organization?.config.thresholds}
                  />

                  {/* Executive KPIs - Connected to real data */}
                  <ExecutiveKPIs 
                    data={kpis} 
                    hasData={hasOperationalData}
                    periodLabel={filters.period === "custom" 
                      ? `${filters.dateRange.from.toLocaleDateString('pt-BR')} - ${filters.dateRange.to.toLocaleDateString('pt-BR')}`
                      : filters.period === "today" ? "Hoje" 
                      : filters.period === "7d" ? "Últimos 7 dias" 
                      : filters.period === "14d" ? "Últimos 14 dias" 
                      : "Últimos 30 dias"
                    }
                  />

                  {/* Weather Correlation Chart */}
                  <WeatherCorrelationChart 
                    operationalData={operationalData}
                    weatherData={chartData}
                  />

                  {/* D-1 Cards */}
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Dados D-1 (Ontem)
                    </h2>
                    <WeatherCards data={weatherData} thresholds={organization?.config.thresholds} />
                  </div>

                  {/* Forecast Section with Tabs */}
                  <Tabs defaultValue="cards" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Previsão D+1 a D+7
                      </h2>
                      <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="cards" className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          Cards
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Calendário
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="cards" className="mt-0">
                      <WeatherForecast data={filteredForecastData} isLoading={isForecastLoading} showTitle={false} />
                    </TabsContent>
                    
                    <TabsContent value="calendar" className="mt-0">
                      <WeatherCalendar 
                        forecastData={filteredForecastData || []} 
                        historicalData={chartData}
                      />
                    </TabsContent>
                  </Tabs>

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
              <div className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                    Meus Dados Operacionais
                    {hasOperationalData && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({operationalData.length} registros)
                      </span>
                    )}
                  </h3>
                  <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Importar Dados
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DataImportWizard 
                        onImport={handleImportData}
                        onClose={() => setIsImportDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                
                {hasOperationalData ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Data</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">Agendadas</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">Concluídas</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">Canceladas</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Motivo</th>
                          <th className="text-center py-2 px-3 font-medium text-muted-foreground">Clima</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operationalData.slice(0, 10).map((record) => (
                          <tr key={record.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-2 px-3">
                              {record.date.toLocaleDateString('pt-BR')}
                            </td>
                            <td className="text-center py-2 px-3">{record.scheduledOperations}</td>
                            <td className="text-center py-2 px-3 text-success">{record.completedOperations}</td>
                            <td className="text-center py-2 px-3 text-destructive">{record.cancelledOperations}</td>
                            <td className="py-2 px-3 text-muted-foreground truncate max-w-[200px]">
                              {record.cancellationReason || '-'}
                            </td>
                            <td className="text-center py-2 px-3">
                              {record.weatherImpact ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning/20 text-warning">⚡</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {operationalData.length > 10 && (
                      <p className="text-center text-xs text-muted-foreground mt-3">
                        Mostrando 10 de {operationalData.length} registros
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Nenhum dado importado ainda</p>
                    <p className="text-xs mt-1">Importe um arquivo CSV para correlacionar com dados climáticos</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center animate-fade-in">
              <div className="text-center text-muted-foreground">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <MapPin className="w-10 h-10 opacity-50" />
                </div>
                <h2 className="text-xl font-display font-semibold mb-2">Selecione uma localidade</h2>
                <p className="text-sm max-w-xs mx-auto">Use a busca na barra lateral para encontrar e salvar localidades</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
