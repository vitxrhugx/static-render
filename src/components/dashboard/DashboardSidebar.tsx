import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, X, Loader2, Plus, Settings, ChevronLeft, Building2, Navigation, Home } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchAddress, GeocodingResult as AddressResult } from "@/lib/geocoding";
import { useOrganization } from "@/hooks/use-organization";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface Location {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface DashboardSidebarProps {
  selectedLocation: Location | null;
  onSelectLocation: (location: Location) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const typeIcons: Record<string, typeof MapPin> = {
  address: Home,
  street: Navigation,
  neighborhood: Building2,
  city: MapPin,
};

export function DashboardSidebar({ selectedLocation, onSelectLocation, isOpen = true, onClose }: DashboardSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { organization, isLoading: isLoadingOrg, addLocation } = useOrganization();

  const debouncedQuery = useDebounce(searchQuery, 600);

  const savedLocations: Location[] = (organization?.locations || [])
    .filter(loc => loc.active)
    .map(loc => ({
      id: loc.id,
      name: loc.name,
      state: loc.address?.split(',').pop()?.trim() || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: loc.address || undefined,
    }));

  // Auto-select first location
  useEffect(() => {
    if (!selectedLocation && savedLocations.length > 0) {
      onSelectLocation(savedLocations[0]);
    }
  }, [savedLocations.length, selectedLocation, onSelectLocation]);

  // Fetch search results
  useEffect(() => {
    async function fetchResults() {
      if (debouncedQuery.length < 3) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      const results = await searchAddress(debouncedQuery);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setIsSearching(false);
    }

    fetchResults();
  }, [debouncedQuery]);

  const handleSelectFromSearch = async (result: AddressResult) => {
    // Check if already saved
    const alreadySaved = savedLocations.some(
      loc => Math.abs(loc.latitude - result.latitude) < 0.001 && 
             Math.abs(loc.longitude - result.longitude) < 0.001
    );

    const locationName = result.details.city || result.name;
    const fullAddress = result.displayName;

    if (!alreadySaved && organization) {
      const newLoc = await addLocation({
        name: locationName,
        address: fullAddress,
        latitude: result.latitude,
        longitude: result.longitude,
        type: result.type === "address" ? "operation_point" : "operation_point",
        active: true,
      });
      
      if (newLoc) {
        onSelectLocation({
          id: newLoc.id,
          name: locationName,
          state: result.details.state || '',
          latitude: newLoc.latitude,
          longitude: newLoc.longitude,
          address: fullAddress,
        });
      }
    } else {
      onSelectLocation({
        id: result.id,
        name: locationName,
        state: result.details.state || '',
        latitude: result.latitude,
        longitude: result.longitude,
        address: fullAddress,
      });
    }
    
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={cn(
        "bg-card border-r border-border h-full flex flex-col transition-all duration-300 z-50",
        "fixed md:relative md:translate-x-0",
        "w-72 md:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 md:hidden border-b border-border">
          <span className="font-display font-semibold text-sm">Localidades</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Endereço, rua, bairro, cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-8 text-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 mt-2 w-[calc(100%-2rem)] left-4 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in max-h-80 overflow-y-auto">
              {searchResults.map((result) => {
                const Icon = typeIcons[result.type] || MapPin;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelectFromSearch(result)}
                    className="w-full px-3 py-2.5 text-left hover:bg-muted flex items-start gap-2.5 transition-colors border-b border-border/50 last:border-b-0"
                  >
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{result.name}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                        {result.displayName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                          {result.latitude.toFixed(5)}, {result.longitude.toFixed(5)}
                        </span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {showResults && searchResults.length === 0 && !isSearching && debouncedQuery.length >= 3 && (
            <div className="absolute z-50 mt-2 w-[calc(100%-2rem)] left-4 bg-card border border-border rounded-lg shadow-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Nenhum endereço encontrado</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Tente incluir cidade ou estado</p>
            </div>
          )}

          {/* Searching indicator */}
          {isSearching && debouncedQuery.length >= 3 && (
            <div className="absolute z-50 mt-2 w-[calc(100%-2rem)] left-4 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Buscando endereço...</span>
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
            
            {isLoadingOrg ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : savedLocations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhuma localidade salva</p>
                <p className="text-xs mt-1">Busque um endereço acima</p>
              </div>
            ) : (
              <div className="space-y-1">
                {savedLocations.map((location) => (
                  <Button
                    key={location.id}
                    variant={selectedLocation?.id === location.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 h-auto py-2 px-3"
                    onClick={() => onSelectLocation(location)}
                  >
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium truncate">
                        {location.name}{location.state ? `, ${location.state}` : ''}
                      </p>
                      {location.address && (
                        <p className="text-[10px] text-muted-foreground truncate font-normal">
                          {location.address}
                        </p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Organization Settings Link */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-3" asChild>
            <Link to="/organization">
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
