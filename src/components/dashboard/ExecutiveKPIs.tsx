import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CloudRain, DollarSign, Activity, AlertTriangle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KPIData } from "@/hooks/use-kpi-calculator";

interface ExecutiveKPIsProps {
  data?: KPIData;
  hasData?: boolean;
  periodLabel?: string;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger";
}

function KPICard({ title, value, subtitle, icon, trend, variant = "default" }: KPICardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-destructive/30 bg-destructive/5",
  };

  const iconVariantStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className={cn("shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold tracking-tight">{value}</span>
              {trend && (
                <span
                  className={cn(
                    "flex items-center text-xs font-medium",
                    trend.isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {trend.value}%
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn("p-3 rounded-xl group-hover:scale-110 transition-transform duration-300", iconVariantStyles[variant])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="p-8 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-display font-semibold text-lg mb-2">Sem dados operacionais</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Importe seus dados operacionais (CSV) para ver KPIs calculados automaticamente
          com base no impacto climático nas suas operações.
        </p>
      </CardContent>
    </Card>
  );
}

export function ExecutiveKPIs({ data, hasData = false, periodLabel = "Período selecionado" }: ExecutiveKPIsProps) {
  const formatCurrency = (value: number) => {
    if (value === 0) return "R$ 0";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: value >= 1000 ? 1 : 0,
      maximumFractionDigits: value >= 1000 ? 1 : 0,
      notation: value >= 10000 ? "compact" : "standard",
    }).format(value);
  };

  if (!hasData || !data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            KPIs Executivos
          </h2>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          KPIs Executivos
        </h2>
        <span className="text-xs text-muted-foreground">{periodLabel}</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Cancelamentos por Clima"
          value={data.cancelledByWeather}
          subtitle={`de ${data.totalCancelled} cancelamentos totais`}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={data.cancelledByWeather > 0 ? "danger" : "default"}
        />
        
        <KPICard
          title="Taxa de Impacto Climático"
          value={`${data.impactPercentage}%`}
          subtitle={`${data.impactedByRain} operações afetadas`}
          icon={<CloudRain className="w-5 h-5" />}
          variant={data.impactPercentage > 50 ? "warning" : "default"}
        />
        
        <KPICard
          title="Economia Potencial"
          value={formatCurrency(data.potentialSavings)}
          subtitle="com planejamento climático"
          icon={<DollarSign className="w-5 h-5" />}
          variant="success"
        />
        
        <KPICard
          title="Taxa de Conclusão"
          value={`${data.completionRate}%`}
          subtitle={`${data.totalCompleted} de ${data.totalScheduled} operações`}
          icon={<Activity className="w-5 h-5" />}
          variant={data.completionRate >= 80 ? "success" : data.completionRate >= 60 ? "warning" : "danger"}
        />
      </div>
    </div>
  );
}