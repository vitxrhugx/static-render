import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, X } from "lucide-react";

interface Location {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

interface DashboardSidebarProps {
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
}

const savedLocations: Location[] = [
  { id: "1", name: "São Paulo", state: "SP", latitude: -23.5475, longitude: -46.6361 },
  { id: "2", name: "Rio de Janeiro", state: "RJ", latitude: -22.9068, longitude: -43.1729 },
  { id: "3", name: "Belo Horizonte", state: "MG", latitude: -19.9167, longitude: -43.9345 },
];

const searchResults: Location[] = [
  { id: "4", name: "Curitiba", state: "PR", latitude: -25.4284, longitude: -49.2733 },
  { id: "5", name: "Porto Alegre", state: "RS", latitude: -30.0346, longitude: -51.2177 },
  { id: "6", name: "Salvador", state: "BA", latitude: -12.9714, longitude: -38.5014 },
];

export function DashboardSidebar({ selectedLocation, onSelectLocation }: DashboardSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(query.length >= 2);
  };

  const handleSelectFromSearch = (location: Location) => {
    onSelectLocation(location);
    setSearchQuery("");
    setShowResults(false);
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar localidade..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setShowResults(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (
          <div className="absolute z-10 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
            {searchResults.map((location) => (
              <button
                key={location.id}
                onClick={() => handleSelectFromSearch(location)}
                className="w-full px-4 py-3 text-left hover:bg-muted flex items-center gap-3 transition-colors"
              >
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{location.name}</p>
                  <p className="text-xs text-muted-foreground">{location.state}, Brasil</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Saved Locations */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star className="w-3 h-3" />
            Minhas Localidades
          </h3>
          <div className="space-y-1">
            {savedLocations.map((location) => (
              <Button
                key={location.id}
                variant={selectedLocation?.id === location.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => onSelectLocation(location)}
              >
                <MapPin className="w-4 h-4" />
                <span className="truncate">{location.name}, {location.state}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
