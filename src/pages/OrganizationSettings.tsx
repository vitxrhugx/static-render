import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Building2, 
  Settings, 
  MapPin, 
  FileSpreadsheet,
  Save,
  Bell,
  Loader2
} from "lucide-react";
import { SectorSelector } from "@/components/organization/SectorSelector";
import { ThresholdEditor } from "@/components/organization/ThresholdEditor";
import { LocationManager } from "@/components/organization/LocationManager";
import { DataImportWizard } from "@/components/organization/DataImportWizard";
import { 
  OrganizationSector, 
  sectorPresets, 
  sectorLabels,
  OrganizationLocation,
  WeatherThresholds,
  OrganizationConfig
} from "@/types/organization";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useOperationalData } from "@/hooks/use-operational-data";
import { useToast } from "@/hooks/use-toast";

export default function OrganizationSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { 
    organization, 
    isLoading: orgLoading, 
    createOrganization, 
    updateOrganization,
    addLocation,
    updateLocation,
    deleteLocation
  } = useOrganization();
  const { importBatch } = useOperationalData(organization?.id);

  // Local state for editing
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [sector, setSector] = useState<OrganizationSector>("outros");
  const [thresholds, setThresholds] = useState<WeatherThresholds>(sectorPresets.outros.thresholds);
  const [notifications, setNotifications] = useState(sectorPresets.outros.notifications);
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when organization loads
  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setCnpj(organization.cnpj || "");
      setSector(organization.sector);
      setThresholds(organization.config.thresholds);
      setNotifications(organization.config.notifications);
      setLocations(organization.locations);
    }
  }, [organization]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSectorChange = (newSector: OrganizationSector) => {
    const preset = sectorPresets[newSector];
    setSector(newSector);
    setThresholds(preset.thresholds);
    setNotifications(preset.notifications);
    setHasChanges(true);
  };

  const handleThresholdsChange = (newThresholds: WeatherThresholds) => {
    setThresholds(newThresholds);
    setHasChanges(true);
  };

  const handleLocationsChange = async (newLocations: OrganizationLocation[]) => {
    // Find added, updated, and deleted locations
    const existingIds = locations.map(l => l.id);
    const newIds = newLocations.map(l => l.id);

    // Deleted locations
    const deletedLocations = locations.filter(l => !newIds.includes(l.id));
    for (const loc of deletedLocations) {
      await deleteLocation(loc.id);
    }

    // Added locations (those without a valid UUID pattern)
    const addedLocations = newLocations.filter(l => !existingIds.includes(l.id) || l.id.length < 36);
    for (const loc of addedLocations) {
      await addLocation({
        name: loc.name,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        type: loc.type,
        active: loc.active,
      });
    }

    // Updated locations
    const updatedLocations = newLocations.filter(l => 
      existingIds.includes(l.id) && 
      l.id.length >= 36 &&
      !addedLocations.includes(l)
    );
    for (const loc of updatedLocations) {
      const original = locations.find(l => l.id === loc.id);
      if (original && JSON.stringify(original) !== JSON.stringify(loc)) {
        await updateLocation(loc.id, {
          name: loc.name,
          address: loc.address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          type: loc.type,
          active: loc.active,
        });
      }
    }

    setLocations(newLocations);
  };

  const handleDataImport = async (data: Record<string, string | number>[]) => {
    const records = data.map(row => ({
      locationId: "",
      date: new Date(row.date as string || new Date()),
      scheduledOperations: Number(row.scheduled || row.scheduledOperations || 0),
      completedOperations: Number(row.completed || row.completedOperations || 0),
      cancelledOperations: Number(row.cancelled || row.cancelledOperations || 0),
      cancellationReason: String(row.reason || row.cancellationReason || ""),
      weatherImpact: Boolean(row.weatherImpact),
      customData: {},
    }));

    const success = await importBatch(records);
    if (success) {
      setShowImportWizard(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const config: OrganizationConfig = {
        thresholds,
        customFields: organization?.config.customFields || [],
        enabledMetrics: sectorPresets[sector].enabledMetrics,
        notifications,
      };

      if (organization) {
        // Update existing
        const success = await updateOrganization({
          name,
          cnpj: cnpj || undefined,
          sector,
          config,
        });
        if (success) {
          setHasChanges(false);
        }
      } else {
        // Create new
        const newOrg = await createOrganization(name, sector, cnpj || undefined);
        if (newOrg) {
          setHasChanges(false);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

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
                <h1 className="font-display font-bold text-lg">
                  {organization ? "Configurações da Organização" : "Configurar Organização"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {organization ? "Gerencie sua empresa e preferências" : "Configure sua empresa para começar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  Alterações não salvas
                </Badge>
              )}
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges && !!organization || isSaving || !name}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {organization ? "Salvar" : "Criar Organização"}
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
            <TabsTrigger value="locations" className="gap-2" disabled={!organization}>
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Localidades</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2" disabled={!organization}>
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
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => {
                        setCnpj(e.target.value);
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <SectorSelector
                  value={sector}
                  onChange={handleSectorChange}
                />

                {sector && (
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">
                      Preset aplicado: {sectorLabels[sector]}
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
                    <Badge variant={notifications.email ? "default" : "outline"}>
                      {notifications.email ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">Push</span>
                    <Badge variant={notifications.push ? "default" : "outline"}>
                      {notifications.push ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">SMS</span>
                    <Badge variant={notifications.sms ? "default" : "outline"}>
                      {notifications.sms ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Thresholds Tab */}
          <TabsContent value="thresholds">
            <ThresholdEditor
              thresholds={thresholds}
              onChange={handleThresholdsChange}
            />
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            {organization ? (
              <LocationManager
                locations={locations}
                onChange={handleLocationsChange}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Salve a organização primeiro para adicionar localidades
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            {!organization ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Salve a organização primeiro para importar dados
                  </p>
                </CardContent>
              </Card>
            ) : showImportWizard ? (
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
