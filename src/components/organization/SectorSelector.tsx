import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Radio, 
  Zap, 
  Truck, 
  Wheat, 
  Building2, 
  ShoppingBag, 
  Briefcase,
  Check
} from "lucide-react";
import { OrganizationSector, sectorLabels, sectorPresets } from "@/types/organization";
import { cn } from "@/lib/utils";

interface SectorSelectorProps {
  value?: OrganizationSector;
  onChange: (sector: OrganizationSector) => void;
}

const sectorIconComponents: Record<OrganizationSector, React.ReactNode> = {
  telecom: <Radio className="w-6 h-6" />,
  energia: <Zap className="w-6 h-6" />,
  logistica: <Truck className="w-6 h-6" />,
  agricultura: <Wheat className="w-6 h-6" />,
  construcao: <Building2 className="w-6 h-6" />,
  varejo: <ShoppingBag className="w-6 h-6" />,
  outros: <Briefcase className="w-6 h-6" />,
};

const sectorDescriptions: Record<OrganizationSector, string> = {
  telecom: "Instalações, manutenções e visitas técnicas",
  energia: "Leituras, reparos e inspeções de rede",
  logistica: "Entregas, coletas e gestão de rotas",
  agricultura: "Plantio, colheita, irrigação e pulverização",
  construcao: "Obras, concretagem e fundações",
  varejo: "Vendas, entregas e gestão de estoque",
  outros: "Operações gerais e atendimentos",
};

export function SectorSelector({ value, onChange }: SectorSelectorProps) {
  const sectors = Object.keys(sectorLabels) as OrganizationSector[];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Setor de Atuação</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {sectors.map((sector) => {
          const isSelected = value === sector;
          const preset = sectorPresets[sector];
          
          return (
            <Card
              key={sector}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected 
                  ? "ring-2 ring-primary border-primary bg-primary/5" 
                  : "hover:border-primary/50"
              )}
              onClick={() => onChange(sector)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    {sectorIconComponents[sector]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{sectorLabels[sector]}</h4>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {sectorDescriptions[sector]}
                    </p>
                  </div>
                </div>

                {/* Preset thresholds preview */}
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Chuva: {preset.thresholds.precipitation.warning}mm
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    Vento: {preset.thresholds.wind.warning}km/h
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
