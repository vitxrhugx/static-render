import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Droplets, 
  Wind, 
  Thermometer,
  AlertTriangle,
  AlertCircle
} from "lucide-react";
import { WeatherThresholds } from "@/types/organization";
import { cn } from "@/lib/utils";

interface ThresholdEditorProps {
  thresholds: WeatherThresholds;
  onChange: (thresholds: WeatherThresholds) => void;
}

export function ThresholdEditor({ thresholds, onChange }: ThresholdEditorProps) {
  const updateThreshold = (
    category: keyof WeatherThresholds,
    field: string,
    value: number
  ) => {
    onChange({
      ...thresholds,
      [category]: {
        ...thresholds[category],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Limiares de Alerta</h3>
        <p className="text-sm text-muted-foreground">
          Configure os limites para gerar alertas de atenção e críticos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Precipitation Thresholds */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Droplets className="w-5 h-5 text-primary" />
              Precipitação
            </CardTitle>
            <CardDescription>Limite em milímetros (mm)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warning Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Atenção
                </Label>
                <span className="text-sm font-medium">
                  {thresholds.precipitation.warning} mm
                </span>
              </div>
              <Slider
                value={[thresholds.precipitation.warning]}
                onValueChange={([v]) => updateThreshold('precipitation', 'warning', v)}
                max={50}
                min={1}
                step={1}
                className="[&_[role=slider]]:bg-amber-500"
              />
            </div>

            {/* Critical Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  Crítico
                </Label>
                <span className="text-sm font-medium">
                  {thresholds.precipitation.critical} mm
                </span>
              </div>
              <Slider
                value={[thresholds.precipitation.critical]}
                onValueChange={([v]) => updateThreshold('precipitation', 'critical', v)}
                max={100}
                min={thresholds.precipitation.warning + 1}
                step={1}
                className="[&_[role=slider]]:bg-destructive"
              />
            </div>
          </CardContent>
        </Card>

        {/* Wind Thresholds */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wind className="w-5 h-5 text-accent" />
              Vento
            </CardTitle>
            <CardDescription>Limite em km/h</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Warning Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  Atenção
                </Label>
                <span className="text-sm font-medium">
                  {thresholds.wind.warning} km/h
                </span>
              </div>
              <Slider
                value={[thresholds.wind.warning]}
                onValueChange={([v]) => updateThreshold('wind', 'warning', v)}
                max={80}
                min={10}
                step={5}
                className="[&_[role=slider]]:bg-amber-500"
              />
            </div>

            {/* Critical Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  Crítico
                </Label>
                <span className="text-sm font-medium">
                  {thresholds.wind.critical} km/h
                </span>
              </div>
              <Slider
                value={[thresholds.wind.critical]}
                onValueChange={([v]) => updateThreshold('wind', 'critical', v)}
                max={120}
                min={thresholds.wind.warning + 5}
                step={5}
                className="[&_[role=slider]]:bg-destructive"
              />
            </div>
          </CardContent>
        </Card>

        {/* Temperature Thresholds */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Thermometer className="w-5 h-5 text-orange-500" />
              Temperatura
            </CardTitle>
            <CardDescription>Limite mínimo e máximo (°C)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Min Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Mínima</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={thresholds.temperature.min}
                    onChange={(e) => updateThreshold('temperature', 'min', Number(e.target.value))}
                    className="w-20 h-8 text-center"
                  />
                  <span className="text-sm text-muted-foreground">°C</span>
                </div>
              </div>
            </div>

            {/* Max Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Máxima</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={thresholds.temperature.max}
                    onChange={(e) => updateThreshold('temperature', 'max', Number(e.target.value))}
                    className="w-20 h-8 text-center"
                  />
                  <span className="text-sm text-muted-foreground">°C</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Alertas serão gerados quando a temperatura estiver fora deste intervalo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
