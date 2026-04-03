import { cn } from "@/lib/utils";
import { Radio, Satellite, MapPin, CheckCircle2, AlertCircle, Info } from "lucide-react";
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

export function WeatherSourceBadge({ sourceInfo, className }: WeatherSourceBadgeProps) {
  const conf = confidenceConfig[sourceInfo.confidence];
  const hasDivergences = sourceInfo.divergences.length > 0;

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
              {sourceInfo.confidence === "high" && "Estação INMET próxima (≤30km) validando dados de satélite. Máxima precisão."}
              {sourceInfo.confidence === "medium" && "Dados cruzados entre satélite e estação física. Boa precisão com possíveis variações locais."}
              {sourceInfo.confidence === "low" && "Apenas dados de modelo/satélite disponíveis. Sem validação de estação terrestre."}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Source indicators */}
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md border cursor-default transition-colors",
                sourceInfo.hasOpenMeteo
                  ? "border-border bg-muted/40 text-foreground"
                  : "border-border/50 bg-muted/20 text-muted-foreground/50"
              )}>
                <Satellite className="w-3 h-3" />
                <span className="font-medium">Satélite</span>
                {sourceInfo.hasOpenMeteo && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Open-Meteo — Dados de modelo/satélite com cobertura global</p>
            </TooltipContent>
          </Tooltip>

          <span className="text-muted-foreground/40">+</span>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md border cursor-default transition-colors",
                sourceInfo.hasInmet
                  ? "border-border bg-muted/40 text-foreground"
                  : "border-border/50 bg-muted/20 text-muted-foreground/50"
              )}>
                <Radio className="w-3 h-3" />
                <span className="font-medium">INMET</span>
                {sourceInfo.hasInmet && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p className="text-xs">
                {sourceInfo.hasInmet
                  ? `Estação ${sourceInfo.inmetStation} — ${sourceInfo.inmetDistance}km da localidade`
                  : "Sem estação INMET próxima disponível"}
              </p>
            </TooltipContent>
          </Tooltip>
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

        {!hasDivergences && sourceInfo.hasInmet && sourceInfo.hasOpenMeteo && (
          <div className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fontes consistentes</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
