import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CloudSun, ArrowLeft, MapPin, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WeatherCards } from "@/components/dashboard/WeatherCards";
import { ExecutiveKPIs } from "@/components/dashboard/ExecutiveKPIs";
import { WeatherForecast } from "@/components/dashboard/WeatherForecast";
import { TemperatureChart } from "@/components/dashboard/TemperatureChart";
import { PrecipitationChart } from "@/components/dashboard/PrecipitationChart";
import { WindChart } from "@/components/dashboard/WindChart";
import { WeatherAlerts } from "@/components/dashboard/WeatherAlerts";
import type { WeatherThresholds } from "@/types/organization";
import type { ForecastDay } from "@/lib/openmeteo";
import type { KPIData } from "@/hooks/use-kpi-calculator";

const demoThresholds: WeatherThresholds = {
  precipitation: { warning: 10, critical: 25 },
  wind: { warning: 30, critical: 50 },
  temperature: { max: 38, min: 8 },
};

const demoWeather = { tempMax: 34, tempMin: 22, precipitation: 18, windMax: 28 };

const demoKPIs: KPIData = {
  totalScheduled: 1240,
  totalCompleted: 1078,
  totalCancelled: 162,
  cancelledByWeather: 94,
  impactedByRain: 138,
  impactPercentage: 58,
  completionRate: 87,
  potentialSavings: 47500,
  productivityRecovered: 94,
  weatherCancellationRate: 58,
};

const today = new Date();
const demoChartData = Array.from({ length: 14 }).map((_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (13 - i));
  return {
    date: d.toISOString().slice(0, 10),
    tempMax: 28 + Math.round(Math.sin(i / 2) * 5),
    tempMin: 18 + Math.round(Math.cos(i / 3) * 3),
    precipitation: Math.max(0, Math.round(Math.sin(i) * 12 + 5)),
    windMax: 15 + Math.round(Math.abs(Math.sin(i / 2)) * 20),
  };
});

const conditions: ForecastDay["condition"][] = [
  "sunny", "partly-cloudy", "cloudy", "rain", "drizzle", "partly-cloudy", "sunny",
];
const demoForecast: ForecastDay[] = Array.from({ length: 7 }).map((_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() + i + 1);
  return {
    date: d,
    tempMax: 28 + Math.round(Math.sin(i) * 4),
    tempMin: 19 + Math.round(Math.cos(i) * 2),
    precipitation: Math.max(0, Math.round(Math.sin(i + 1) * 14)),
    precipitationProbability: Math.min(95, Math.max(5, 30 + i * 8)),
    windMax: 18 + i * 3,
    condition: conditions[i],
  };
});

export default function DemoDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-sm">
            <CloudSun className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold">Climatch</span>
          <Badge variant="secondary" className="ml-2 gap-1">
            <Sparkles className="w-3 h-3" />
            Demo
          </Badge>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <Button size="sm" variant="hero" asChild>
            <Link to="/signup">Criar conta</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Você está vendo uma demonstração com dados fictícios</p>
              <p className="text-xs text-muted-foreground">
                Para usar com seus dados reais, crie uma conta e configure sua organização.
              </p>
            </div>
            <Button size="sm" asChild>
              <Link to="/signup">Começar grátis</Link>
            </Button>
          </div>

          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">-23.55052, -46.63331</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">
              São Paulo, SP
            </h1>
          </div>

          <WeatherAlerts
            forecastData={demoForecast}
            severityFilter={{ critical: true, warning: true }}
            thresholds={demoThresholds}
          />

          <ExecutiveKPIs data={demoKPIs} hasData periodLabel="Últimos 14 dias" />

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Dados D-1 (Ontem)
            </h2>
            <WeatherCards data={demoWeather} thresholds={demoThresholds} />
          </div>

          <WeatherForecast data={demoForecast} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TemperatureChart data={demoChartData} />
            <PrecipitationChart data={demoChartData} />
          </div>

          <WindChart data={demoChartData} />
        </div>
      </main>
    </div>
  );
}
