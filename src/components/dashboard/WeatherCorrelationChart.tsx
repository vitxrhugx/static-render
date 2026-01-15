import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CloudRain, Wind, Thermometer, TrendingUp, AlertTriangle } from "lucide-react";
import type { OperationalData } from "@/types/organization";

interface WeatherCorrelationChartProps {
  operationalData: OperationalData[];
  weatherData?: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    precipitation: number;
    windMax: number;
  }>;
}

interface CorrelationData {
  factor: string;
  cancellations: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

export function WeatherCorrelationChart({ operationalData }: WeatherCorrelationChartProps) {
  const correlationData = useMemo<CorrelationData[]>(() => {
    if (!operationalData.length) return [];

    // Count cancellations by reason keywords
    let rainRelated = 0;
    let windRelated = 0;
    let tempRelated = 0;
    let otherCancellations = 0;

    operationalData.forEach(record => {
      if (!record.cancelledOperations) return;
      
      const reason = (record.cancellationReason || '').toLowerCase();
      const cancelled = record.cancelledOperations;
      
      // Check for rain-related keywords
      if (
        reason.includes('chuva') ||
        reason.includes('temporal') ||
        reason.includes('tempestade') ||
        reason.includes('alagamento') ||
        reason.includes('enchente')
      ) {
        rainRelated += cancelled;
      }
      // Check for wind-related keywords
      else if (
        reason.includes('vento') ||
        reason.includes('ventania') ||
        reason.includes('vendaval')
      ) {
        windRelated += cancelled;
      }
      // Check for temperature-related keywords
      else if (
        reason.includes('calor') ||
        reason.includes('frio') ||
        reason.includes('temperatura') ||
        reason.includes('geada')
      ) {
        tempRelated += cancelled;
      }
      // If weather impact is true but no specific keyword
      else if (record.weatherImpact) {
        // Distribute to most common factor
        rainRelated += cancelled * 0.6;
        windRelated += cancelled * 0.3;
        tempRelated += cancelled * 0.1;
      }
      else {
        otherCancellations += cancelled;
      }
    });

    const totalWeatherCancellations = rainRelated + windRelated + tempRelated;
    
    if (totalWeatherCancellations === 0) {
      return [];
    }

    return [
      {
        factor: "Chuva",
        cancellations: Math.round(rainRelated),
        percentage: Math.round((rainRelated / totalWeatherCancellations) * 100),
        icon: <CloudRain className="w-4 h-4" />,
        color: "hsl(199, 89%, 48%)",
      },
      {
        factor: "Vento",
        cancellations: Math.round(windRelated),
        percentage: Math.round((windRelated / totalWeatherCancellations) * 100),
        icon: <Wind className="w-4 h-4" />,
        color: "hsl(160, 84%, 39%)",
      },
      {
        factor: "Temperatura",
        cancellations: Math.round(tempRelated),
        percentage: Math.round((tempRelated / totalWeatherCancellations) * 100),
        icon: <Thermometer className="w-4 h-4" />,
        color: "hsl(25, 95%, 53%)",
      },
    ];
  }, [operationalData]);

  // Calculate insights
  const insights = useMemo(() => {
    if (!correlationData.length) return null;

    const topFactor = [...correlationData].sort((a, b) => b.cancellations - a.cancellations)[0];
    const totalCancellations = correlationData.reduce((sum, d) => sum + d.cancellations, 0);
    
    return {
      topFactor,
      totalCancellations,
    };
  }, [correlationData]);

  if (!operationalData.length) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Correlação Clima × Operações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Importe dados operacionais para ver a análise de correlação</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!correlationData.length || !insights) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Correlação Clima × Operações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CloudRain className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum cancelamento por clima identificado nos dados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Correlação Clima × Operações
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {insights.totalCancellations} cancelamentos por clima
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={correlationData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="factor" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={70}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as CorrelationData;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                          <p className="font-medium text-sm">{data.factor}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {data.cancellations} cancelamentos ({data.percentage}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="cancellations" radius={[0, 4, 4, 0]}>
                  {correlationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights Panel */}
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Principal Fator
              </p>
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${insights.topFactor.color}20` }}
                >
                  {insights.topFactor.icon}
                </div>
                <div>
                  <p className="font-display font-semibold">{insights.topFactor.factor}</p>
                  <p className="text-xs text-muted-foreground">
                    {insights.topFactor.percentage}% dos cancelamentos
                  </p>
                </div>
              </div>
            </div>

            {/* Factor breakdown */}
            <div className="space-y-2">
              {correlationData.map((item) => (
                <div key={item.factor} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.factor}</span>
                  </div>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
