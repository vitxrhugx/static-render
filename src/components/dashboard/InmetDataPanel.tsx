import { useState, useEffect } from "react";
import { findNearestInmetStation, getInmetStationData, InmetStation, InmetDailyData } from "@/lib/inmet";
import { Loader2, Radio, Thermometer, Droplets, Wind, CloudRain, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InmetDataPanelProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function InmetDataPanel({ latitude, longitude, className }: InmetDataPanelProps) {
  const [station, setStation] = useState<InmetStation | null>(null);
  const [data, setData] = useState<InmetDailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const nearest = await findNearestInmetStation(latitude, longitude);
        if (cancelled) return;

        if (!nearest) {
          setError("Nenhuma estação INMET encontrada");
          setIsLoading(false);
          return;
        }

        setStation(nearest);

        const end = format(new Date(), "yyyy-MM-dd");
        const start = format(subDays(new Date(), 7), "yyyy-MM-dd");

        const stationData = await getInmetStationData(nearest.CD_ESTACAO, start, end);
        if (cancelled) return;

        setData(stationData);
      } catch (e) {
        if (!cancelled) setError("Erro ao carregar dados INMET");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [latitude, longitude]);

  if (isLoading) {
    return (
      <div className={cn("bg-card rounded-xl p-6 shadow-card", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Buscando estação INMET mais próxima...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-card rounded-xl p-6 shadow-card", className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Radio className="w-5 h-5 opacity-50" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const latest = data.length > 0 ? data[data.length - 1] : null;

  const metrics = latest ? [
    { label: "Temp. Máx", value: latest.tempMax !== null ? `${latest.tempMax}°C` : "—", icon: Thermometer, color: "text-red-500" },
    { label: "Temp. Mín", value: latest.tempMin !== null ? `${latest.tempMin}°C` : "—", icon: Thermometer, color: "text-blue-500" },
    { label: "Precipitação", value: latest.precipitation !== null ? `${latest.precipitation} mm` : "—", icon: Droplets, color: "text-sky-500" },
    { label: "Vento Máx", value: latest.windMax !== null ? `${latest.windMax} km/h` : "—", icon: Wind, color: "text-emerald-500" },
    { label: "Umidade", value: latest.humidity !== null ? `${latest.humidity}%` : "—", icon: CloudRain, color: "text-violet-500" },
  ] : [];

  return (
    <div className={cn("bg-card rounded-xl shadow-card overflow-hidden", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Radio className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm">Estação INMET</h3>
              {station && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {station.DC_NOME} — {station.SG_ESTADO}
                  <span className="text-[10px] opacity-60">({station.CD_ESTACAO})</span>
                </p>
              )}
            </div>
          </div>
          <span className={cn(
            "text-[10px] font-medium px-2 py-0.5 rounded-full",
            station?.CD_SITUACAO === "Operante" 
              ? "bg-emerald-500/10 text-emerald-600" 
              : "bg-muted text-muted-foreground"
          )}>
            {station?.CD_SITUACAO || "—"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {latest ? (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              Último registro: {format(new Date(latest.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="text-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                  <m.icon className={cn("w-4 h-4 mx-auto mb-1.5", m.color)} />
                  <p className="text-lg font-bold font-display">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Mini historical table */}
            {data.length > 1 && (
              <div className="mt-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Histórico recente ({data.length} dias)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">Data</th>
                        <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Máx</th>
                        <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Mín</th>
                        <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Chuva</th>
                        <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Vento</th>
                        <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">Umid.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(-7).reverse().map((d) => (
                        <tr key={d.date} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="py-1.5 px-2">{format(new Date(d.date), "dd/MM")}</td>
                          <td className="text-center py-1.5 px-2">{d.tempMax !== null ? `${d.tempMax}°` : "—"}</td>
                          <td className="text-center py-1.5 px-2">{d.tempMin !== null ? `${d.tempMin}°` : "—"}</td>
                          <td className="text-center py-1.5 px-2">{d.precipitation !== null ? `${d.precipitation}mm` : "—"}</td>
                          <td className="text-center py-1.5 px-2">{d.windMax !== null ? `${d.windMax}` : "—"}</td>
                          <td className="text-center py-1.5 px-2">{d.humidity !== null ? `${d.humidity}%` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem dados disponíveis para esta estação</p>
          </div>
        )}
      </div>
    </div>
  );
}
