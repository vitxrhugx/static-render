import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  MapPin, 
  Plus, 
  Building2, 
  GitBranch, 
  Target,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { OrganizationLocation } from "@/types/organization";
import { cn } from "@/lib/utils";

interface LocationManagerProps {
  locations: OrganizationLocation[];
  onChange: (locations: OrganizationLocation[]) => void;
}

const locationTypeIcons: Record<OrganizationLocation["type"], React.ReactNode> = {
  headquarters: <Building2 className="w-4 h-4" />,
  branch: <GitBranch className="w-4 h-4" />,
  operation_point: <Target className="w-4 h-4" />,
};

const locationTypeLabels: Record<OrganizationLocation["type"], string> = {
  headquarters: "Matriz",
  branch: "Filial",
  operation_point: "Ponto de Operação",
};

const emptyLocation: Omit<OrganizationLocation, 'id'> = {
  name: "",
  address: "",
  latitude: 0,
  longitude: 0,
  type: "operation_point",
  active: true,
};

export function LocationManager({ locations, onChange }: LocationManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<OrganizationLocation | null>(null);
  const [formData, setFormData] = useState<Omit<OrganizationLocation, 'id'>>(emptyLocation);

  const handleAddNew = () => {
    setEditingLocation(null);
    setFormData(emptyLocation);
    setIsDialogOpen(true);
  };

  const handleEdit = (location: OrganizationLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || "",
      latitude: location.latitude,
      longitude: location.longitude,
      type: location.type,
      active: location.active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.latitude || !formData.longitude) return;

    if (editingLocation) {
      // Update existing
      onChange(
        locations.map((loc) =>
          loc.id === editingLocation.id
            ? { ...loc, ...formData }
            : loc
        )
      );
    } else {
      // Add new
      const newLocation: OrganizationLocation = {
        ...formData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      onChange([...locations, newLocation]);
    }

    setIsDialogOpen(false);
    setFormData(emptyLocation);
    setEditingLocation(null);
  };

  const handleDelete = (id: string) => {
    onChange(locations.filter((loc) => loc.id !== id));
  };

  const handleToggleActive = (id: string) => {
    onChange(
      locations.map((loc) =>
        loc.id === id ? { ...loc, active: !loc.active } : loc
      )
    );
  };

  const activeLocations = locations.filter((l) => l.active);
  const inactiveLocations = locations.filter((l) => !l.active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Localidades</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as localidades monitoradas pela sua organização
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Localidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Editar Localidade" : "Nova Localidade"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Escritório Central"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Ex: Av. Paulista, 1000"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.0001"
                    placeholder="-23.5505"
                    value={formData.latitude || ""}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    placeholder="-46.6333"
                    value={formData.longitude || ""}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Localidade</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: OrganizationLocation["type"]) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="headquarters">Matriz</SelectItem>
                    <SelectItem value="branch">Filial</SelectItem>
                    <SelectItem value="operation_point">Ponto de Operação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.latitude || !formData.longitude}>
                {editingLocation ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations List */}
      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma localidade cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Adicione localidades para monitorar as condições climáticas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Active Locations */}
          {activeLocations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Ativas ({activeLocations.length})
              </h4>
              <div className="grid gap-2">
                {activeLocations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    onEdit={() => handleEdit(location)}
                    onDelete={() => handleDelete(location.id)}
                    onToggleActive={() => handleToggleActive(location.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Locations */}
          {inactiveLocations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Inativas ({inactiveLocations.length})
              </h4>
              <div className="grid gap-2">
                {inactiveLocations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    onEdit={() => handleEdit(location)}
                    onDelete={() => handleDelete(location.id)}
                    onToggleActive={() => handleToggleActive(location.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LocationCardProps {
  location: OrganizationLocation;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function LocationCard({ location, onEdit, onDelete, onToggleActive }: LocationCardProps) {
  return (
    <Card className={cn(!location.active && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              location.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {locationTypeIcons[location.type]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{location.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {locationTypeLabels[location.type]}
                </Badge>
              </div>
              {location.address && (
                <p className="text-sm text-muted-foreground">{location.address}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleActive}
              title={location.active ? "Desativar" : "Ativar"}
            >
              {location.active ? (
                <ToggleRight className="w-4 h-4 text-accent" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
