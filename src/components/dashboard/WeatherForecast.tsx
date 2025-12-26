import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSun, 
  CloudDrizzle,
  Droplets,
  Wind
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ForecastDay } from "@/lib/openmeteo";

interface WeatherForecastProps {
  data?: ForecastDay[] | null;
  isLoading?: boolean;
}

function getConditionIcon(condition: ForecastDay["condition"]) {
  switch (condition) {
    case "sunny":
      return <Sun className="w-8 h-8 text-warning" />;
    case "partly-cloudy":
      return <CloudSun className="w-8 h-8 text-muted-foreground" />;
    case "cloudy":
      return <Cloud className="w-8 h-8 text-muted-foreground" />;
    case "drizzle":
      return <CloudDrizzle className="w-8 h-8 text-info" />;
    case "rain":
      return <CloudRain className="w-8 h-8 text-info" />;
    default:
      return <Sun className="w-8 h-8 text-warning" />;
  }
}

function getConditionLabel(condition: ForecastDay["condition"]) {
  switch (condition) {
    case "sunny":
      return "Ensolarado";
    case "partly-cloudy":
      return "Parcialmente nublado";
    case "cloudy":
      return "Nublado";
    case "drizzle":
      return "Chuvisco";
    case "rain":
      return "Chuva";
    default:
      return "Ensolarado";
  }
}

function getRiskLevel(precipitationProbability: number, windMax: number) {
  if (precipitationProbability >= 70 || windMax >= 30) {
    return { level: "high", label: "Alto Risco", color: "bg-destructive text-destructive-foreground" };
  }
  if (precipitationProbability >= 40 || windMax >= 20) {
    return { level: "medium", label: "Atenção", color: "bg-warning text-warning-foreground" };
  }
  return { level: "low", label: "Favorável", color: "bg-success text-success-foreground" };
}

interface ForecastCardProps {
  day: ForecastDay;
  isFirst?: boolean;
}

function ForecastCard({ day, isFirst }: ForecastCardProps) {
  const risk = getRiskLevel(day.precipitationProbability, day.windMax);
  const dayName = format(day.date, "EEE", { locale: ptBR });
  const dayNumber = format(day.date, "dd/MM");
  
  return (
    <Card className={cn(
      "transition-all hover:shadow-lg hover:-translate-y-1",
      isFirst && "ring-2 ring-primary/30 bg-primary/5"
    )}>
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          {/* Day Header */}
          <div>
            <p className={cn(
              "text-sm font-semibold capitalize",
              isFirst ? "text-primary" : "text-foreground"
            )}>
              {isFirst ? "Amanhã" : dayName}
            </p>
            <p className="text-xs text-muted-foreground">{dayNumber}</p>
          </div>
          
          {/* Weather Icon */}
          <div className="flex justify-center">
            {getConditionIcon(day.condition)}
          </div>
          
          {/* Condition Label */}
          <p className="text-xs text-muted-foreground">
            {getConditionLabel(day.condition)}
          </p>
          
          {/* Temperature */}
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg font-bold">{day.tempMax}°</span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">{day.tempMin}°</span>
          </div>
          
          {/* Details */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Droplets className="w-3 h-3" />
              <span>{day.precipitationProbability}% ({day.precipitation}mm)</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Wind className="w-3 h-3" />
              <span>{day.windMax} km/h</span>
            </div>
          </div>
          
          {/* Risk Badge */}
          <div className={cn(
            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
            risk.color
          )}>
            {risk.label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          <div>
            <Skeleton className="h-4 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
          <Skeleton className="h-8 w-8 mx-auto rounded-full" />
          <Skeleton className="h-3 w-16 mx-auto" />
          <Skeleton className="h-5 w-14 mx-auto" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-20 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
          <Skeleton className="h-5 w-16 mx-auto rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function WeatherForecast({ data, isLoading }: WeatherForecastProps) {
  // Count risk levels for summary
  const riskCounts = data?.reduce(
    (acc, day) => {
      const risk = getRiskLevel(day.precipitationProbability, day.windMax);
      acc[risk.level]++;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  ) || { high: 0, medium: 0, low: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Previsão D+1 a D+7
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Previsão meteorológica para os próximos 7 dias
          </p>
        </div>
        
        {/* Risk Summary */}
        {data && data.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">{riskCounts.low} favoráveis</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">{riskCounts.medium} atenção</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">{riskCounts.high} alto risco</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, index) => (
            <ForecastCardSkeleton key={index} />
          ))
        ) : data && data.length > 0 ? (
          data.map((day, index) => (
            <ForecastCard 
              key={day.date.toISOString()} 
              day={day} 
              isFirst={index === 0}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p className="text-sm">Não foi possível carregar a previsão</p>
          </div>
        )}
      </div>
    </div>
  );
}
