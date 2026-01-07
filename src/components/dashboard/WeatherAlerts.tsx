import { AlertTriangle, CloudRain, Wind, ThermometerSun, X, Bell, ChevronRight, BellRing, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ForecastDay } from "@/lib/openmeteo";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
interface Alert {
  id: string;
  type: "rain" | "wind" | "heat" | "combined";
  severity: "warning" | "critical";
  title: string;
  description: string;
  days: string[];
  icon: React.ReactNode;
}

interface WeatherAlertsProps {
  forecastData?: ForecastDay[] | null;
}

function analyzeForecasts(data: ForecastDay[]): Alert[] {
  const alerts: Alert[] = [];
  
  // Check for high precipitation probability
  const rainyDays = data.filter(day => day.precipitationProbability >= 70);
  const moderateRainDays = data.filter(day => day.precipitationProbability >= 50 && day.precipitationProbability < 70);
  
  if (rainyDays.length > 0) {
    alerts.push({
      id: "rain-critical",
      type: "rain",
      severity: "critical",
      title: "Alerta de Chuva Intensa",
      description: `${rainyDays.length} dia${rainyDays.length > 1 ? 's' : ''} com alta probabilidade de precipitação (≥70%). Risco de alagamentos e interrupções operacionais.`,
      days: rainyDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <CloudRain className="w-5 h-5" />,
    });
  } else if (moderateRainDays.length >= 3) {
    alerts.push({
      id: "rain-warning",
      type: "rain",
      severity: "warning",
      title: "Atenção: Chuvas Frequentes",
      description: `${moderateRainDays.length} dias com chance moderada de chuva. Planeje atividades externas com cautela.`,
      days: moderateRainDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <CloudRain className="w-5 h-5" />,
    });
  }
  
  // Check for high wind speeds
  const windyDays = data.filter(day => day.windMax >= 30);
  const moderateWindDays = data.filter(day => day.windMax >= 20 && day.windMax < 30);
  
  if (windyDays.length > 0) {
    alerts.push({
      id: "wind-critical",
      type: "wind",
      severity: "critical",
      title: "Alerta de Ventos Fortes",
      description: `${windyDays.length} dia${windyDays.length > 1 ? 's' : ''} com rajadas acima de 30 km/h. Risco para trabalhos em altura e estruturas temporárias.`,
      days: windyDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <Wind className="w-5 h-5" />,
    });
  } else if (moderateWindDays.length >= 2) {
    alerts.push({
      id: "wind-warning",
      type: "wind",
      severity: "warning",
      title: "Atenção: Ventos Moderados",
      description: `${moderateWindDays.length} dias com ventos entre 20-30 km/h. Monitore atividades sensíveis ao vento.`,
      days: moderateWindDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <Wind className="w-5 h-5" />,
    });
  }
  
  // Check for extreme heat
  const hotDays = data.filter(day => day.tempMax >= 35);
  const warmDays = data.filter(day => day.tempMax >= 32 && day.tempMax < 35);
  
  if (hotDays.length > 0) {
    alerts.push({
      id: "heat-critical",
      type: "heat",
      severity: "critical",
      title: "Alerta de Calor Extremo",
      description: `${hotDays.length} dia${hotDays.length > 1 ? 's' : ''} com temperatura acima de 35°C. Risco de estresse térmico para trabalhadores.`,
      days: hotDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <ThermometerSun className="w-5 h-5" />,
    });
  } else if (warmDays.length >= 3) {
    alerts.push({
      id: "heat-warning",
      type: "heat",
      severity: "warning",
      title: "Atenção: Calor Intenso",
      description: `${warmDays.length} dias com temperatura elevada (32-35°C). Reforce hidratação e pausas.`,
      days: warmDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
      icon: <ThermometerSun className="w-5 h-5" />,
    });
  }
  
  // Check for combined risks (worst days)
  const criticalDays = data.filter(
    day => day.precipitationProbability >= 70 && day.windMax >= 25
  );
  
  if (criticalDays.length > 0) {
    alerts.unshift({
      id: "combined-critical",
      type: "combined",
      severity: "critical",
      title: "Condições Críticas Combinadas",
      description: `${criticalDays.length} dia${criticalDays.length > 1 ? 's' : ''} com chuva intensa E ventos fortes simultaneamente. Considere suspender atividades externas.`,
      days: criticalDays.map(d => format(d.date, "EEE, dd/MM", { locale: ptBR })),
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

export function WeatherAlerts({ forecastData }: WeatherAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { isSupported, permission, requestPermission, sendNotification } = useNotifications();
  const { toast } = useToast();
  const sentNotificationsRef = useRef<Set<string>>(new Set());
  
  const allAlerts = forecastData && forecastData.length > 0 ? analyzeForecasts(forecastData) : [];
  const visibleAlerts = allAlerts.filter(alert => !dismissedAlerts.includes(alert.id));
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
