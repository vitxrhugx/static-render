import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar as CalendarIcon, 
  SlidersHorizontal, 
  ChevronDown,
  Thermometer,
  CloudRain,
  Wind,
  AlertTriangle,
  RotateCcw,
  X
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface FilterState {
  dateRange: {
    from: Date;
    to: Date;
  };
  period: string;
  metrics: {
    temperature: boolean;
    precipitation: boolean;
    wind: boolean;
  };
  alertSeverity: {
    critical: boolean;
    warning: boolean;
  };
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const periodPresets = [
  { label: "Hoje", value: "today", days: 0 },
  { label: "Últimos 7 dias", value: "7d", days: 7 },
  { label: "Últimos 14 dias", value: "14d", days: 14 },
  { label: "Últimos 30 dias", value: "30d", days: 30 },
  { label: "Personalizado", value: "custom", days: null },
];

export const defaultFilters: FilterState = {
  dateRange: {
    from: subDays(new Date(), 7),
    to: new Date(),
  },
  period: "7d",
  metrics: {
    temperature: true,
    precipitation: true,
    wind: true,
  },
  alertSeverity: {
    critical: true,
    warning: true,
  },
};

export function DashboardFilters({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.dateRange.from,
    to: filters.dateRange.to,
  });

  const handlePeriodChange = (preset: typeof periodPresets[0]) => {
    if (preset.value === "custom") {
      onFiltersChange({ ...filters, period: "custom" });
      return;
    }

    const to = new Date();
    const from = preset.days === 0 ? startOfDay(new Date()) : subDays(to, preset.days);
    
    onFiltersChange({
      ...filters,
      period: preset.value,
      dateRange: { from, to },
    });
    setIsDateOpen(false);
  };

  const handleDateRangeApply = () => {
    if (tempDateRange.from && tempDateRange.to) {
      onFiltersChange({
        ...filters,
        period: "custom",
        dateRange: {
          from: startOfDay(tempDateRange.from),
          to: endOfDay(tempDateRange.to),
        },
      });
      setIsDateOpen(false);
    }
  };

  const handleMetricToggle = (metric: keyof FilterState["metrics"]) => {
    onFiltersChange({
      ...filters,
      metrics: {
        ...filters.metrics,
        [metric]: !filters.metrics[metric],
      },
    });
  };

  const handleAlertToggle = (severity: keyof FilterState["alertSeverity"]) => {
    onFiltersChange({
      ...filters,
      alertSeverity: {
        ...filters.alertSeverity,
        [severity]: !filters.alertSeverity[severity],
      },
    });
  };

  const handleReset = () => {
    onFiltersChange(defaultFilters);
  };

  const activeFiltersCount = [
    filters.period !== "7d",
    !Object.values(filters.metrics).every(Boolean),
    !Object.values(filters.alertSeverity).every(Boolean),
  ].filter(Boolean).length;

  const formatDateRange = () => {
    const preset = periodPresets.find(p => p.value === filters.period);
    if (preset && preset.value !== "custom") {
      return preset.label;
    }
    return `${format(filters.dateRange.from, "dd/MM", { locale: ptBR })} - ${format(filters.dateRange.to, "dd/MM", { locale: ptBR })}`;
  };

  const activeMetrics = Object.entries(filters.metrics)
    .filter(([_, active]) => active)
    .map(([key]) => key);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Period Filter */}
      <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "gap-2 h-9",
              filters.period !== "7d" && "border-primary bg-primary/5"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            {formatDateRange()}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover" align="start">
          <div className="flex">
            {/* Presets */}
            <div className="border-r border-border p-2 space-y-1">
              {periodPresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={filters.period === preset.value ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => handlePeriodChange(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            
            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                selected={{
                  from: tempDateRange.from,
                  to: tempDateRange.to,
                }}
                onSelect={(range) => setTempDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={1}
                locale={ptBR}
                disabled={{ after: new Date() }}
              />
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsDateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  onClick={handleDateRangeApply}
                  disabled={!tempDateRange.from || !tempDateRange.to}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Metrics Filter */}
      <Popover open={isMetricsOpen} onOpenChange={setIsMetricsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "gap-2 h-9",
              activeMetrics.length < 3 && "border-primary bg-primary/5"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Métricas
            {activeMetrics.length < 3 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activeMetrics.length}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 bg-popover" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">Exibir métricas</p>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="metric-temp"
                  checked={filters.metrics.temperature}
                  onCheckedChange={() => handleMetricToggle("temperature")}
                />
                <Label 
                  htmlFor="metric-temp" 
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  Temperatura
                </Label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="metric-precip"
                  checked={filters.metrics.precipitation}
                  onCheckedChange={() => handleMetricToggle("precipitation")}
                />
                <Label 
                  htmlFor="metric-precip" 
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <CloudRain className="w-4 h-4 text-blue-500" />
                  Precipitação
                </Label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="metric-wind"
                  checked={filters.metrics.wind}
                  onCheckedChange={() => handleMetricToggle("wind")}
                />
                <Label 
                  htmlFor="metric-wind" 
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Wind className="w-4 h-4 text-teal-500" />
                  Vento
                </Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Alerts Filter */}
      <Popover open={isAlertsOpen} onOpenChange={setIsAlertsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "gap-2 h-9",
              (!filters.alertSeverity.critical || !filters.alertSeverity.warning) && "border-primary bg-primary/5"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            Alertas
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 bg-popover" align="start">
          <div className="space-y-3">
            <p className="text-sm font-medium">Exibir alertas</p>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="alert-critical"
                  checked={filters.alertSeverity.critical}
                  onCheckedChange={() => handleAlertToggle("critical")}
                />
                <Label 
                  htmlFor="alert-critical" 
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Críticos
                </Label>
              </div>
              
              <div className="flex items-center gap-3">
                <Checkbox
                  id="alert-warning"
                  checked={filters.alertSeverity.warning}
                  onCheckedChange={() => handleAlertToggle("warning")}
                />
                <Label 
                  htmlFor="alert-warning" 
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  Atenção
                </Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Indicator & Reset */}
      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-9 text-muted-foreground hover:text-foreground"
          onClick={handleReset}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar filtros
        </Button>
      )}

      {/* Quick Remove Active Filter Badges */}
      <div className="flex flex-wrap gap-1.5 ml-2">
        {filters.period !== "7d" && filters.period !== "custom" && (
          <Badge 
            variant="secondary" 
            className="gap-1 cursor-pointer hover:bg-secondary/80"
            onClick={() => handlePeriodChange(periodPresets[1])}
          >
            {periodPresets.find(p => p.value === filters.period)?.label}
            <X className="w-3 h-3" />
          </Badge>
        )}
        
        {activeMetrics.length < 3 && activeMetrics.length > 0 && (
          <Badge 
            variant="secondary" 
            className="gap-1"
          >
            {activeMetrics.length} métrica{activeMetrics.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </div>
  );
}
