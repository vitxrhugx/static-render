import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Building2, 
  Settings, 
  MapPin, 
  FileSpreadsheet,
  Save,
  Bell
} from "lucide-react";
import { SectorSelector } from "@/components/organization/SectorSelector";
import { ThresholdEditor } from "@/components/organization/ThresholdEditor";
import { LocationManager } from "@/components/organization/LocationManager";
import { DataImportWizard } from "@/components/organization/DataImportWizard";
import { 
  Organization, 
  OrganizationSector, 
  sectorPresets, 
  sectorLabels,
  OrganizationLocation,
  WeatherThresholds
} from "@/types/organization";
import { useToast } from "@/hooks/use-toast";

const defaultOrganization: Partial<Organization> = {
  name: "",
  cnpj: "",
  sector: "outros",
  config: {
    ...sectorPresets["outros"],
    customFields: [],
  },
  locations: [],
};

export default function OrganizationSettings() {
  const { toast } = useToast();
  const [organization, setOrganization] = useState<Partial<Organization>>(defaultOrganization);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSectorChange = (sector: OrganizationSector) => {
    const preset = sectorPresets[sector];
    setOrganization(prev => ({
      ...prev,
      sector,
      config: {
        ...prev.config!,
        thresholds: preset.thresholds,
        enabledMetrics: preset.enabledMetrics,
        notifications: preset.notifications,
      },
    }));
    setHasChanges(true);
  };

  const handleThresholdsChange = (thresholds: WeatherThresholds) => {
    setOrganization(prev => ({
      ...prev,
      config: {
        ...prev.config!,
        thresholds,
      },
    }));
    setHasChanges(true);
  };

  const handleLocationsChange = (locations: OrganizationLocation[]) => {
    setOrganization(prev => ({
      ...prev,
      locations,
    }));
    setHasChanges(true);
  };

  const handleDataImport = (data: Record<string, string | number>[]) => {
    console.log("Imported data:", data);
    toast({
      title: "Dados importados com sucesso",
      description: `${data.length} registros foram adicionados`,
    });
    setShowImportWizard(false);
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Configurações salvas",
      description: "As configurações da organização foram atualizadas",
    });
    setHasChanges(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="font-display font-bold text-lg">Configurações da Organização</h1>
                <p className="text-sm text-muted-foreground">
                  Configure sua empresa e preferências
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  Alterações não salvas
                </Badge>
              )}
              <Button onClick={handleSave} disabled={!hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="thresholds" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Limiares</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Localidades</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Dados básicos da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Minha Empresa LTDA"
                      value={organization.name}
                      onChange={(e) => {
                        setOrganization(prev => ({ ...prev, name: e.target.value }));
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={organization.cnpj}
                      onChange={(e) => {
                        setOrganization(prev => ({ ...prev, cnpj: e.target.value }));
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <SectorSelector
                  value={organization.sector}
                  onChange={handleSectorChange}
                />

                {organization.sector && (
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">
                      Preset aplicado: {sectorLabels[organization.sector]}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Os limiares de alerta foram configurados com base nas melhores práticas do setor. 
                      Você pode personalizá-los na aba "Limiares".
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notifications Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificações
                </CardTitle>
                <CardDescription>
                  Configure como deseja receber alertas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">E-mail</span>
                    <Badge variant={organization.config?.notifications.email ? "default" : "outline"}>
                      {organization.config?.notifications.email ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">Push</span>
                    <Badge variant={organization.config?.notifications.push ? "default" : "outline"}>
                      {organization.config?.notifications.push ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">SMS</span>
                    <Badge variant={organization.config?.notifications.sms ? "default" : "outline"}>
                      {organization.config?.notifications.sms ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Thresholds Tab */}
          <TabsContent value="thresholds">
            {organization.config && (
              <ThresholdEditor
                thresholds={organization.config.thresholds}
                onChange={handleThresholdsChange}
              />
            )}
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <LocationManager
              locations={organization.locations || []}
              onChange={handleLocationsChange}
            />
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            {showImportWizard ? (
              <DataImportWizard
                onImport={handleDataImport}
                onClose={() => setShowImportWizard(false)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Dados Operacionais
                  </CardTitle>
                  <CardDescription>
                    Importe dados do seu sistema para correlacionar com informações climáticas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">Nenhum dado importado</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Importe um arquivo CSV com seus dados operacionais para visualizar 
                      correlações com condições climáticas
                    </p>
                    <Button onClick={() => setShowImportWizard(true)}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Iniciar Importação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
