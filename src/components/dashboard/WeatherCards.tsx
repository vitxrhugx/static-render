import { Thermometer, Droplets, Wind, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherThresholds } from "@/types/organization";

interface WeatherData {
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windMax: number;
}

interface WeatherCardsProps {
  data: WeatherData;
  thresholds?: WeatherThresholds;
}

type AlertLevel = "normal" | "warning" | "critical";

function getAlertLevel(
  value: number,
  type: "precipitation" | "wind" | "tempMax" | "tempMin",
  thresholds?: WeatherThresholds
): AlertLevel {
  if (!thresholds) return "normal";

  switch (type) {
    case "precipitation":
      if (value >= thresholds.precipitation.critical) return "critical";
      if (value >= thresholds.precipitation.warning) return "warning";
      return "normal";
    case "wind":
      if (value >= thresholds.wind.critical) return "critical";
      if (value >= thresholds.wind.warning) return "warning";
      return "normal";
    case "tempMax":
      if (value >= thresholds.temperature.max) return "critical";
      if (value >= thresholds.temperature.max - 3) return "warning";
      return "normal";
    case "tempMin":
      if (value <= thresholds.temperature.min) return "critical";
      if (value <= thresholds.temperature.min + 3) return "warning";
      return "normal";
    default:
      return "normal";
  }
}

const alertStyles: Record<AlertLevel, { border: string; badge: string; badgeText: string }> = {
  normal: {
    border: "border-transparent",
    badge: "",
    badgeText: "",
  },
  warning: {
    border: "border-warning/50 ring-2 ring-warning/20",
    badge: "bg-warning text-warning-foreground",
    badgeText: "Alerta",
  },
  critical: {
    border: "border-destructive/50 ring-2 ring-destructive/20",
    badge: "bg-destructive text-destructive-foreground",
    badgeText: "Crítico",
  },
};

export function WeatherCards({ data, thresholds }: WeatherCardsProps) {
  const cards = [
    {
      label: "Temp. Máxima",
      value: `${data.tempMax}°C`,
      rawValue: data.tempMax,
      type: "tempMax" as const,
      icon: Thermometer,
      gradient: "gradient-temp-hot",
      threshold: thresholds ? `Limite: ${thresholds.temperature.max}°C` : null,
    },
    {
      label: "Temp. Mínima",
      value: `${data.tempMin}°C`,
      rawValue: data.tempMin,
      type: "tempMin" as const,
      icon: Thermometer,
      gradient: "gradient-temp-cold",
      threshold: thresholds ? `Limite: ${thresholds.temperature.min}°C` : null,
    },
    {
      label: "Precipitação",
      value: `${data.precipitation} mm`,
      rawValue: data.precipitation,
      type: "precipitation" as const,
      icon: Droplets,
      gradient: "gradient-rain",
      threshold: thresholds ? `Alerta: ${thresholds.precipitation.warning}mm` : null,
    },
    {
      label: "Vento Máx.",
      value: `${data.windMax} km/h`,
      rawValue: data.windMax,
      type: "wind" as const,
      icon: Wind,
      gradient: "gradient-wind",
      threshold: thresholds ? `Alerta: ${thresholds.wind.warning}km/h` : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const alertLevel = getAlertLevel(card.rawValue, card.type, thresholds);
        const styles = alertStyles[alertLevel];

        return (
          <div
            key={card.label}
            className={cn(
              "bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 animate-fade-in border-2 group cursor-default",
              styles.border
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-1.5">
                {alertLevel !== "normal" && (
                  <span className={cn("text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1", styles.badge)}>
                    <AlertTriangle className="w-3 h-3" />
                    {styles.badgeText}
                  </span>
                )}
                <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-full bg-muted">
                  D-1
                </span>
              </div>
            </div>
            <p className="text-2xl font-display font-bold mb-1">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            {card.threshold && alertLevel !== "normal" && (
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                {card.threshold}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
