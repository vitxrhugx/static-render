import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, CloudRain, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIData {
  cancelledByWeather: number;
  totalCancelled: number;
  impactedByRain: number;
  impactPercentage: number;
  potentialSavings: number;
  productivityRecovered: number;
}

interface ExecutiveKPIsProps {
  data?: KPIData;
}

// Demo data based on document specs
const defaultData: KPIData = {
  cancelledByWeather: 23,
  totalCancelled: 45,
  impactedByRain: 18,
  impactPercentage: 78,
  potentialSavings: 45200,
  productivityRecovered: 34,
};

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
    <Card className={cn("shadow-card transition-all hover:shadow-lg hover:-translate-y-0.5", variantStyles[variant])}>
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
          <div className={cn("p-3 rounded-xl", iconVariantStyles[variant])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveKPIs({ data = defaultData }: ExecutiveKPIsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      notation: "compact",
    }).format(value);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          KPIs Executivos
        </h2>
        <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Cancelamentos por Clima"
          value={data.cancelledByWeather}
          subtitle={`de ${data.totalCancelled} cancelamentos totais`}
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="danger"
          trend={{ value: 12, isPositive: false }}
        />
        
        <KPICard
          title="Impactados por Chuva"
          value={`${data.impactPercentage}%`}
          subtitle={`${data.impactedByRain} operações afetadas`}
          icon={<CloudRain className="w-5 h-5" />}
          variant="warning"
        />
        
        <KPICard
          title="Economia Potencial"
          value={formatCurrency(data.potentialSavings)}
          subtitle="com planejamento baseado em clima"
          icon={<DollarSign className="w-5 h-5" />}
          variant="success"
          trend={{ value: 23, isPositive: true }}
        />
        
        <KPICard
          title="Produtividade Recuperada"
          value={`+${data.productivityRecovered}%`}
          subtitle="vs. período sem análise climática"
          icon={<Activity className="w-5 h-5" />}
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
      </div>
    </div>
  );
}
