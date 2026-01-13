import { AlertTriangle, CloudRain, Wind, ThermometerSun, Snowflake, X, Bell, ChevronRight, BellRing, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ForecastDay } from "@/lib/openmeteo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { WeatherThresholds } from "@/types/organization";

interface Alert {
  id: string;
  type: "rain" | "wind" | "heat" | "cold" | "combined";
  severity: "warning" | "critical";
  title: string;
  description: string;
  days: string[];
  icon: React.ReactNode;
}

interface SeverityFilter {
  critical: boolean;
  warning: boolean;
}

interface WeatherAlertsProps {
  forecastData?: ForecastDay[] | null;
  severityFilter?: SeverityFilter;
  thresholds?: WeatherThresholds;
}

// Default thresholds if not provided
const defaultThresholds: WeatherThresholds = {
  precipitation: { warning: 10, critical: 25 },
  wind: { warning: 30, critical: 50 },
  temperature: { min: 5, max: 40 },
};

function analyzeForecasts(data: ForecastDay[], thresholds: WeatherThresholds): Alert[] {
  const alerts: Alert[] = [];
  
  // Check for precipitation based on organization thresholds
  const criticalRainDays = data.filter(day => day.precipitation >= thresholds.precipitation.critical);
  const warningRainDays = data.filter(day => 
    day.precipitation >= thresholds.precipitation.warning && 
    day.precipitation < thresholds.precipitation.critical
  );
  
  // Also check probability for days without actual precipitation amount
  const highProbabilityDays = data.filter(day => day.precipitationProbability >= 70 && day.precipitation < thresholds.precipitation.warning);
  
  if (criticalRainDays.length > 0) {
    alerts.push({
      id: "rain-critical",
      type: "rain",
      severity: "critical",
      title: "Alerta de Chuva Crítica",
      description: `${criticalRainDays.length} dia${criticalRainDays.length > 1 ? 's' : ''} com precipitação ≥${thresholds.precipitation.critical}mm. Operações externas em risco.`,
      days: criticalRainDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <CloudRain className="w-5 h-5" />,
    });
  }
  
  if (warningRainDays.length > 0 || highProbabilityDays.length >= 2) {
    const affectedDays = [...warningRainDays, ...highProbabilityDays];
    alerts.push({
      id: "rain-warning",
      type: "rain",
      severity: "warning",
      title: "Atenção: Chuvas Previstas",
      description: `${affectedDays.length} dia${affectedDays.length > 1 ? 's' : ''} com chuva entre ${thresholds.precipitation.warning}-${thresholds.precipitation.critical}mm ou alta probabilidade.`,
      days: [...new Set(affectedDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })))],
      icon: <CloudRain className="w-5 h-5" />,
    });
  }
  
  // Check for wind based on organization thresholds
  const criticalWindDays = data.filter(day => day.windMax >= thresholds.wind.critical);
  const warningWindDays = data.filter(day => 
    day.windMax >= thresholds.wind.warning && 
    day.windMax < thresholds.wind.critical
  );
  
  if (criticalWindDays.length > 0) {
    alerts.push({
      id: "wind-critical",
      type: "wind",
      severity: "critical",
      title: "Alerta de Ventos Críticos",
      description: `${criticalWindDays.length} dia${criticalWindDays.length > 1 ? 's' : ''} com rajadas ≥${thresholds.wind.critical}km/h. Trabalhos em altura suspensos.`,
      days: criticalWindDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <Wind className="w-5 h-5" />,
    });
  }
  
  if (warningWindDays.length > 0) {
    alerts.push({
      id: "wind-warning",
      type: "wind",
      severity: "warning",
      title: "Atenção: Ventos Moderados",
      description: `${warningWindDays.length} dia${warningWindDays.length > 1 ? 's' : ''} com ventos entre ${thresholds.wind.warning}-${thresholds.wind.critical}km/h.`,
      days: warningWindDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <Wind className="w-5 h-5" />,
    });
  }
  
  // Check for extreme heat (above max threshold)
  const criticalHeatDays = data.filter(day => day.tempMax >= thresholds.temperature.max + 5);
  const warningHeatDays = data.filter(day => 
    day.tempMax >= thresholds.temperature.max && 
    day.tempMax < thresholds.temperature.max + 5
  );
  
  if (criticalHeatDays.length > 0) {
    alerts.push({
      id: "heat-critical",
      type: "heat",
      severity: "critical",
      title: "Alerta de Calor Extremo",
      description: `${criticalHeatDays.length} dia${criticalHeatDays.length > 1 ? 's' : ''} com temperatura ≥${thresholds.temperature.max + 5}°C. Risco de estresse térmico.`,
      days: criticalHeatDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <ThermometerSun className="w-5 h-5" />,
    });
  }
  
  if (warningHeatDays.length > 0) {
    alerts.push({
      id: "heat-warning",
      type: "heat",
      severity: "warning",
      title: "Atenção: Calor Intenso",
      description: `${warningHeatDays.length} dia${warningHeatDays.length > 1 ? 's' : ''} com temperatura acima do limite (${thresholds.temperature.max}°C).`,
      days: warningHeatDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <ThermometerSun className="w-5 h-5" />,
    });
  }
  
  // Check for extreme cold (below min threshold)
  const criticalColdDays = data.filter(day => day.tempMin <= thresholds.temperature.min - 5);
  const warningColdDays = data.filter(day => 
    day.tempMin <= thresholds.temperature.min && 
    day.tempMin > thresholds.temperature.min - 5
  );
  
  if (criticalColdDays.length > 0) {
    alerts.push({
      id: "cold-critical",
      type: "cold",
      severity: "critical",
      title: "Alerta de Frio Extremo",
      description: `${criticalColdDays.length} dia${criticalColdDays.length > 1 ? 's' : ''} com temperatura ≤${thresholds.temperature.min - 5}°C. Risco de hipotermia.`,
      days: criticalColdDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <Snowflake className="w-5 h-5" />,
    });
  }
  
  if (warningColdDays.length > 0) {
    alerts.push({
      id: "cold-warning",
      type: "cold",
      severity: "warning",
      title: "Atenção: Frio Intenso",
      description: `${warningColdDays.length} dia${warningColdDays.length > 1 ? 's' : ''} com temperatura abaixo do limite (${thresholds.temperature.min}°C).`,
      days: warningColdDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <Snowflake className="w-5 h-5" />,
    });
  }
  
  // Check for combined critical risks
  const combinedCriticalDays = data.filter(
    day => 
      (day.precipitation >= thresholds.precipitation.critical || day.precipitationProbability >= 80) && 
      day.windMax >= thresholds.wind.warning
  );
  
  if (combinedCriticalDays.length > 0) {
    alerts.unshift({
      id: "combined-critical",
      type: "combined",
      severity: "critical",
      title: "Condições Críticas Combinadas",
      description: `${combinedCriticalDays.length} dia${combinedCriticalDays.length > 1 ? 's' : ''} com chuva + ventos fortes. Considere suspender atividades externas.`,
      days: combinedCriticalDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <AlertTriangle className="w-5 h-5" />,
    });
  }
  
  return alerts;
}

interface AlertCardProps {
  alert: Alert;
  onDismiss: (id: string) => void;
}

function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const severityStyles = {
    critical: {
      container: "bg-destructive/10 border-destructive/30",
      icon: "bg-destructive/20 text-destructive",
      badge: "bg-destructive text-destructive-foreground",
    },
    warning: {
      container: "bg-warning/10 border-warning/30",
      icon: "bg-warning/20 text-warning",
      badge: "bg-warning text-warning-foreground",
    },
  };
  
  const styles = severityStyles[alert.severity];
  
  return (
    <div className={cn(
      "relative rounded-lg border p-4 transition-all",
      styles.container
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", styles.icon)}>
          {alert.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              styles.badge
            )}>
              {alert.severity === "critical" ? "Crítico" : "Atenção"}
            </span>
          </div>
          
          <h4 className="font-semibold text-foreground mb-1">{alert.title}</h4>
          <p className="text-sm text-muted-foreground">{alert.description}</p>
          
          {/* Days affected */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
          >
            <ChevronRight className={cn(
              "w-3 h-3 transition-transform",
              isExpanded && "rotate-90"
            )} />
            Ver dias afetados ({alert.days.length})
          </button>
          
          {isExpanded && (
            <div className="mt-2 flex flex-wrap gap-1">
              {alert.days.map((day, index) => (
                <span
                  key={index}
                  className="text-xs bg-background/50 px-2 py-1 rounded border border-border/50"
                >
                  {day}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
          onClick={() => onDismiss(alert.id)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function WeatherAlerts({ forecastData, severityFilter, thresholds }: WeatherAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { isSupported, permission, requestPermission, sendNotification } = useNotifications();
  const { toast } = useToast();
  const sentNotificationsRef = useRef<Set<string>>(new Set());
  
  // Use provided thresholds or defaults
  const activeThresholds = thresholds || defaultThresholds;
  
  const allAlerts = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return [];
    return analyzeForecasts(forecastData, activeThresholds);
  }, [forecastData, activeThresholds]);
  
  // Apply severity filter
  const filteredBySeverity = allAlerts.filter(alert => {
    if (!severityFilter) return true;
    if (alert.severity === "critical" && !severityFilter.critical) return false;
    if (alert.severity === "warning" && !severityFilter.warning) return false;
    return true;
  });
  
  const visibleAlerts = filteredBySeverity.filter(alert => !dismissedAlerts.includes(alert.id));
  const criticalAlerts = visibleAlerts.filter(a => a.severity === "critical");
  
  // Send browser notifications for critical alerts
  useEffect(() => {
    if (!notificationsEnabled || permission !== "granted") return;
    
    criticalAlerts.forEach(alert => {
      if (!sentNotificationsRef.current.has(alert.id)) {
        sendNotification({
          title: alert.title,
          body: alert.description,
          tag: alert.id,
        });
        sentNotificationsRef.current.add(alert.id);
      }
    });
  }, [criticalAlerts, notificationsEnabled, permission, sendNotification]);
  
  const handleToggleNotifications = async () => {
    if (!isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return;
    }
    
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais alertas meteorológicos.",
      });
      return;
    }
    
    if (permission === "granted") {
      setNotificationsEnabled(true);
      toast({
        title: "Notificações ativadas",
        description: "Você receberá alertas críticos automaticamente.",
      });
    } else if (permission === "denied") {
      toast({
        title: "Permissão negada",
        description: "Habilite notificações nas configurações do navegador.",
        variant: "destructive",
      });
    } else {
      const granted = await requestPermission();
      if (granted) {
        setNotificationsEnabled(true);
        toast({
          title: "Notificações ativadas",
          description: "Você receberá alertas críticos automaticamente.",
        });
      } else {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações para receber alertas.",
          variant: "destructive",
        });
      }
    }
  };

  if (!forecastData || forecastData.length === 0) {
    return null;
  }
  
  if (visibleAlerts.length === 0) {
    // Show a success message when using custom thresholds
    if (thresholds) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Nenhum alerta ativo</h4>
              <p className="text-sm text-muted-foreground">
                Previsão dentro dos limites configurados para sua organização.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }
  
  const criticalCount = criticalAlerts.length;
  const warningCount = visibleAlerts.filter(a => a.severity === "warning").length;
  
  const handleDismiss = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };
  
  const handleDismissAll = () => {
    setDismissedAlerts(allAlerts.map(a => a.id));
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Alertas Meteorológicos
          </h2>
          <div className="flex items-center gap-1 ml-2">
            {criticalCount > 0 && (
              <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs bg-warning text-warning-foreground px-2 py-0.5 rounded-full">
                {warningCount} atenção
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={notificationsEnabled ? "default" : "outline"}
            size="sm"
            className="text-xs gap-1.5"
            onClick={handleToggleNotifications}
          >
            {notificationsEnabled ? (
              <>
                <BellRing className="w-3.5 h-3.5" />
                Notificações ativas
              </>
            ) : (
              <>
                <BellOff className="w-3.5 h-3.5" />
                Ativar notificações
              </>
            )}
          </Button>
          
          {visibleAlerts.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleDismissAll}
            >
              Dispensar todos
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid gap-3 md:grid-cols-2">
        {visibleAlerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
}
