import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle,
  Snowflake,
  CloudLightning,
  Thermometer,
  Wind,
  Droplets,
  AlertTriangle
} from "lucide-react";
import { ForecastDay } from "@/lib/openmeteo";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface WeatherCalendarProps {
  forecastData?: ForecastDay[] | null;
  historicalData?: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    precipitation: number;
    windMax: number;
  }>;
}

interface DayWeatherData {
  date: Date;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipitationProbability?: number;
  windMax: number;
  condition?: ForecastDay["condition"];
  riskLevel: 'low' | 'medium' | 'high';
  isForecast: boolean;
}

function getRiskLevel(precipProbability: number, windMax: number): 'low' | 'medium' | 'high' {
  if (precipProbability >= 70 || windMax >= 50) return 'high';
  if (precipProbability >= 40 || windMax >= 30) return 'medium';
  return 'low';
}

function getConditionIcon(condition: ForecastDay["condition"] | undefined, size = 20) {
  const props = { size, className: "shrink-0" };
  switch (condition) {
    case "sunny": return <Sun {...props} className="text-amber-500" />;
    case "partly-cloudy": return <Cloud {...props} className="text-slate-400" />;
    case "cloudy": return <Cloud {...props} className="text-slate-500" />;
    case "rain": return <CloudRain {...props} className="text-blue-500" />;
    case "drizzle": return <CloudDrizzle {...props} className="text-blue-400" />;
    default: return <Sun {...props} className="text-amber-500" />;
  }
}

function getConditionLabel(condition: ForecastDay["condition"] | undefined): string {
  switch (condition) {
    case "sunny": return "Ensolarado";
    case "partly-cloudy": return "Parcialmente Nublado";
    case "cloudy": return "Nublado";
    case "rain": return "Chuvoso";
    case "drizzle": return "Garoa";
    default: return "Ensolarado";
  }
}

function getRiskColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high': return 'bg-destructive/20 border-destructive/40';
    case 'medium': return 'bg-amber-500/20 border-amber-500/40';
    case 'low': return 'bg-accent/20 border-accent/40';
  }
}

function getRiskDotColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high': return 'bg-destructive';
    case 'medium': return 'bg-amber-500';
    case 'low': return 'bg-accent';
  }
}

export function WeatherCalendar({ forecastData, historicalData }: WeatherCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Combine forecast and historical data into a map
  const weatherMap = useMemo(() => {
    const map = new Map<string, DayWeatherData>();

    // Add historical data
    historicalData?.forEach(day => {
      const date = new Date(day.date);
      const dateKey = format(date, 'yyyy-MM-dd');
      map.set(dateKey, {
        date,
        tempMax: day.tempMax,
        tempMin: day.tempMin,
        precipitation: day.precipitation,
        windMax: day.windMax,
        riskLevel: getRiskLevel(day.precipitation > 0 ? 50 : 0, day.windMax),
        isForecast: false,
      });
    });

    // Add forecast data
    forecastData?.forEach(day => {
      const dateKey = format(day.date, 'yyyy-MM-dd');
      map.set(dateKey, {
        date: day.date,
        tempMax: day.tempMax,
        tempMin: day.tempMin,
        precipitation: day.precipitation,
        precipitationProbability: day.precipitationProbability,
        windMax: day.windMax,
        condition: day.condition,
        riskLevel: getRiskLevel(day.precipitationProbability, day.windMax),
        isForecast: true,
      });
    });

    return map;
  }, [forecastData, historicalData]);

  // Get selected day data
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return weatherMap.get(dateKey) || null;
  }, [selectedDate, weatherMap]);

  // Custom day render function
  const modifiers = useMemo(() => {
    const highRisk: Date[] = [];
    const mediumRisk: Date[] = [];
    const lowRisk: Date[] = [];

    weatherMap.forEach((data, _) => {
      if (data.riskLevel === 'high') highRisk.push(data.date);
      else if (data.riskLevel === 'medium') mediumRisk.push(data.date);
      else lowRisk.push(data.date);
    });

    return { highRisk, mediumRisk, lowRisk };
  }, [weatherMap]);

  const modifiersStyles = {
    highRisk: {
      backgroundColor: 'hsl(var(--destructive) / 0.15)',
      borderRadius: '50%',
    },
    mediumRisk: {
      backgroundColor: 'hsl(25 95% 53% / 0.15)',
      borderRadius: '50%',
    },
    lowRisk: {
      backgroundColor: 'hsl(var(--accent) / 0.15)',
      borderRadius: '50%',
    },
  };

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      setSelectedDate(day);
      const dateKey = format(day, 'yyyy-MM-dd');
      if (weatherMap.has(dateKey)) {
        setIsDialogOpen(true);
      }
    }
  };

  // Stats for current month view
  const monthStats = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    let highRiskDays = 0;
    let mediumRiskDays = 0;
    let rainyDays = 0;

    daysInMonth.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const data = weatherMap.get(dateKey);
      if (data) {
        if (data.riskLevel === 'high') highRiskDays++;
        if (data.riskLevel === 'medium') mediumRiskDays++;
        if (data.precipitation > 0 || data.condition === 'rain' || data.condition === 'drizzle') {
          rainyDays++;
        }
      }
    });

    return { highRiskDays, mediumRiskDays, rainyDays };
  }, [currentMonth, weatherMap]);

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            Calendário Meteorológico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar */}
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ptBR}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border p-3 pointer-events-auto"
              />
            </div>

            {/* Legend and Stats */}
            <div className="lg:w-64 space-y-4">
              {/* Legend */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Legenda</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded-full", getRiskDotColor('high'))} />
                    <span>Risco Alto</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded-full", getRiskDotColor('medium'))} />
                    <span>Risco Médio</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded-full", getRiskDotColor('low'))} />
                    <span>Risco Baixo</span>
                  </div>
                </div>
              </div>

              {/* Month Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Resumo de {format(currentMonth, 'MMMM', { locale: ptBR })}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-sm">Dias Críticos</span>
                    </div>
                    <span className="font-semibold text-destructive">{monthStats.highRiskDays}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm">Dias Atenção</span>
                    </div>
                    <span className="font-semibold text-amber-600">{monthStats.mediumRiskDays}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-2">
                      <CloudRain className="w-4 h-4 text-primary" />
                      <span className="text-sm">Dias com Chuva</span>
                    </div>
                    <span className="font-semibold text-primary">{monthStats.rainyDays}</span>
                  </div>
                </div>
              </div>

              {/* Quick tip */}
              <p className="text-xs text-muted-foreground">
                Clique em um dia com dados para ver detalhes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          {selectedDayData && (
            <div className="space-y-4">
              {/* Condition and Risk */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getConditionIcon(selectedDayData.condition, 32)}
                  <div>
                    <p className="font-medium">{getConditionLabel(selectedDayData.condition)}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDayData.isForecast ? 'Previsão' : 'Histórico'}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="outline"
                  className={cn(
                    "capitalize",
                    getRiskColor(selectedDayData.riskLevel)
                  )}
                >
                  Risco {selectedDayData.riskLevel === 'high' ? 'Alto' : 
                         selectedDayData.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-2 gap-3">
                {/* Temperature */}
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Temperatura</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {selectedDayData.tempMax.toFixed(0)}° / {selectedDayData.tempMin.toFixed(0)}°
                  </p>
                  <p className="text-xs text-muted-foreground">Máx / Mín</p>
                </div>

                {/* Precipitation */}
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Precipitação</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {selectedDayData.precipitation.toFixed(1)} mm
                  </p>
                  {selectedDayData.precipitationProbability !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {selectedDayData.precipitationProbability}% chance
                    </p>
                  )}
                </div>

                {/* Wind */}
                <div className="p-3 rounded-lg bg-secondary/50 col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Vento Máximo</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {selectedDayData.windMax.toFixed(0)} km/h
                  </p>
                </div>
              </div>

              {/* Risk Alert */}
              {selectedDayData.riskLevel !== 'low' && (
                <div className={cn(
                  "p-3 rounded-lg border",
                  getRiskColor(selectedDayData.riskLevel)
                )}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={cn(
                      "w-4 h-4 mt-0.5",
                      selectedDayData.riskLevel === 'high' ? 'text-destructive' : 'text-amber-600'
                    )} />
                    <div>
                      <p className="text-sm font-medium">
                        {selectedDayData.riskLevel === 'high' 
                          ? 'Condições críticas previstas' 
                          : 'Atenção às condições climáticas'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedDayData.riskLevel === 'high'
                          ? 'Considere reprogramar operações ao ar livre'
                          : 'Monitore as condições durante o dia'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
