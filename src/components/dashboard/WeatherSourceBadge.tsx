import { cn } from "@/lib/utils";
import { Radio, Satellite, MapPin, CheckCircle2, AlertCircle, Globe, Sun } from "lucide-react";
import type { SourceInfo, ConfidenceLevel } from "@/lib/unified-weather";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeatherSourceBadgeProps {
  sourceInfo: SourceInfo;
  className?: string;
}

const confidenceConfig: Record<ConfidenceLevel, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
  high: { label: "Alta confiança", dotClass: "bg-emerald-500", bgClass: "bg-emerald-500/10 border-emerald-500/20", textClass: "text-emerald-700 dark:text-emerald-400" },
  medium: { label: "Confiança moderada", dotClass: "bg-amber-500", bgClass: "bg-amber-500/10 border-amber-500/20", textClass: "text-amber-700 dark:text-amber-400" },
  low: { label: "Confiança limitada", dotClass: "bg-orange-500", bgClass: "bg-orange-500/10 border-orange-500/20", textClass: "text-orange-700 dark:text-orange-400" },
};

interface SourceItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  tooltip: string;
}

export function WeatherSourceBadge({ sourceInfo, className }: WeatherSourceBadgeProps) {
  const conf = confidenceConfig[sourceInfo.confidence];
  const hasDivergences = sourceInfo.divergences.length > 0;

  const sources: SourceItem[] = [
    {
      key: "openmeteo",
      label: "Satélite",
      icon: <Satellite className="w-3 h-3" />,
      active: sourceInfo.hasOpenMeteo,
      tooltip: "Open-Meteo — Dados de modelo/satélite (GFS, ECMWF, ERA5)",
    },
    {
      key: "inmet",
      label: "INMET",
      icon: <Radio className="w-3 h-3" />,
      active: sourceInfo.hasInmet,
      tooltip: sourceInfo.hasInmet
        ? `Estação ${sourceInfo.inmetStation} — ${sourceInfo.inmetDistance}km`
        : "Sem estação INMET próxima disponível",
    },
    {
      key: "nasa",
      label: "NASA",
      icon: <Globe className="w-3 h-3" />,
      active: sourceInfo.hasNasaPower,
      tooltip: "NASA POWER — Radiação solar, temperatura e precipitação global",
    },
    {
      key: "cptec",
      label: "CPTEC",
      icon: <Sun className="w-3 h-3" />,
      active: sourceInfo.hasCptec,
      tooltip: "CPTEC/INPE — Previsão meteorológica nacional brasileira",
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {/* Confidence pill */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border cursor-default transition-colors",
              conf.bgClass, conf.textClass
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", conf.dotClass)} />
              {conf.label}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">
              {sourceInfo.activeSources} fonte{sourceInfo.activeSources !== 1 ? "s" : ""} ativa{sourceInfo.activeSources !== 1 ? "s" : ""}.{" "}
              {sourceInfo.confidence === "high" && "Múltiplas fontes cruzadas com estação terrestre próxima."}
              {sourceInfo.confidence === "medium" && "Dados cruzados entre fontes. Boa precisão com possíveis variações locais."}
              {sourceInfo.confidence === "low" && "Poucas fontes disponíveis. Precisão limitada."}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Source indicators */}
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          {sources.map((src, i) => (
            <div key={src.key} className="inline-flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground/30">·</span>}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md border cursor-default transition-colors",
                    src.active
                      ? "border-border bg-muted/40 text-foreground"
                      : "border-border/50 bg-muted/20 text-muted-foreground/40"
                  )}>
                    {src.icon}
                    <span className="font-medium">{src.label}</span>
                    {src.active && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{src.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ))}
        </div>

        {/* Station distance */}
        {sourceInfo.hasInmet && sourceInfo.inmetDistance !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-default">
                <MapPin className="w-3 h-3" />
                <span>{sourceInfo.inmetDistance}km</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Distância da estação INMET mais próxima</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Divergence indicator */}
        {hasDivergences && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 cursor-default">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="font-medium">{sourceInfo.divergences.length} divergência{sourceInfo.divergences.length > 1 ? "s" : ""}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium mb-1.5">Diferenças entre fontes:</p>
                {sourceInfo.divergences.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 text-xs">
                    <span>{d.label}</span>
                    <span className="tabular-nums font-medium">
                      {d.openMeteoValue} vs {d.inmetValue} ({d.diffPercent}%)
                    </span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {!hasDivergences && sourceInfo.activeSources >= 2 && (
          <div className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fontes consistentes</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
