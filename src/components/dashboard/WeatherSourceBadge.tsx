import { cn } from "@/lib/utils";
import { Radio, Satellite, GitMerge, MapPin, AlertTriangle, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import type { SourceInfo, ConfidenceLevel } from "@/lib/unified-weather";

interface WeatherSourceBadgeProps {
  sourceInfo: SourceInfo;
  className?: string;
}

const confidenceConfig: Record<ConfidenceLevel, { label: string; color: string; icon: typeof ShieldCheck }> = {
  high: { label: "Alta", color: "text-emerald-600 bg-emerald-500/10", icon: ShieldCheck },
  medium: { label: "Média", color: "text-amber-600 bg-amber-500/10", icon: Shield },
  low: { label: "Baixa", color: "text-orange-600 bg-orange-500/10", icon: ShieldAlert },
};

export function WeatherSourceBadge({ sourceInfo, className }: WeatherSourceBadgeProps) {
  const conf = confidenceConfig[sourceInfo.confidence];
  const ConfIcon = conf.icon;

  return (
    <div className={cn("bg-card rounded-xl shadow-card overflow-hidden", className)}>
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-primary" />
            Fontes de Dados Meteorológicos
          </h3>
          <div className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", conf.color)}>
            <ConfIcon className="w-3.5 h-3.5" />
            Confiança {conf.label}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Sources Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Open-Meteo */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            sourceInfo.hasOpenMeteo 
              ? "border-emerald-500/30 bg-emerald-500/5" 
              : "border-border bg-muted/30 opacity-60"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              sourceInfo.hasOpenMeteo ? "bg-emerald-500/15" : "bg-muted"
            )}>
              <Satellite className={cn("w-4 h-4", sourceInfo.hasOpenMeteo ? "text-emerald-600" : "text-muted-foreground")} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Open-Meteo</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {sourceInfo.hasOpenMeteo ? "Modelo/satélite • Cobertura global" : "Sem dados"}
              </p>
            </div>
            <div className={cn(
              "ml-auto w-2 h-2 rounded-full flex-shrink-0",
              sourceInfo.hasOpenMeteo ? "bg-emerald-500" : "bg-muted-foreground/30"
            )} />
          </div>

          {/* INMET */}
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-colors",
            sourceInfo.hasInmet 
              ? "border-emerald-500/30 bg-emerald-500/5" 
              : "border-border bg-muted/30 opacity-60"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              sourceInfo.hasInmet ? "bg-emerald-500/15" : "bg-muted"
            )}>
              <Radio className={cn("w-4 h-4", sourceInfo.hasInmet ? "text-emerald-600" : "text-muted-foreground")} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">INMET</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {sourceInfo.hasInmet 
                  ? `${sourceInfo.inmetStation} • ${sourceInfo.inmetDistance}km` 
                  : "Sem estação próxima"}
              </p>
            </div>
            <div className={cn(
              "ml-auto w-2 h-2 rounded-full flex-shrink-0",
              sourceInfo.hasInmet ? "bg-emerald-500" : "bg-muted-foreground/30"
            )} />
          </div>
        </div>

        {/* INMET Station Distance Info */}
        {sourceInfo.hasInmet && sourceInfo.inmetDistance !== undefined && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <MapPin className="w-3 h-3" />
            <span>
              Estação a <strong className="text-foreground">{sourceInfo.inmetDistance} km</strong> da localidade
              {sourceInfo.inmetDistance <= 30 && " — dados INMET priorizados"}
              {sourceInfo.inmetDistance > 30 && sourceInfo.inmetDistance <= 50 && " — dados INMET priorizados (distância moderada)"}
              {sourceInfo.inmetDistance > 50 && " — média ponderada entre fontes"}
            </span>
          </div>
        )}

        {/* Divergence Alerts */}
        {sourceInfo.divergences.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Divergências detectadas ({sourceInfo.divergences.length})
            </p>
            <div className="space-y-1.5">
              {sourceInfo.divergences.map((d, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-center justify-between text-xs px-3 py-2 rounded-lg",
                    d.severity === "high" ? "bg-destructive/10 text-destructive" :
                    d.severity === "medium" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" :
                    "bg-muted/60 text-muted-foreground"
                  )}
                >
                  <span className="font-medium">{d.label}</span>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="flex items-center gap-1">
                      <Satellite className="w-3 h-3" />
                      {d.openMeteoValue}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      {d.inmetValue}
                    </span>
                    <span className="font-semibold">({d.diffPercent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sourceInfo.divergences.length === 0 && sourceInfo.hasInmet && sourceInfo.hasOpenMeteo && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-500/5 px-3 py-2 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fontes consistentes — sem divergências significativas</span>
          </div>
        )}
      </div>
    </div>
  );
}
