import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, X, Loader2, Plus, Settings } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchLocations, GeocodingResult } from "@/lib/openmeteo";
import { useOrganization } from "@/hooks/use-organization";
import { Link } from "react-router-dom";

export interface Location {
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

export function DashboardSidebar({ selectedLocation, onSelectLocation }: DashboardSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { organization, isLoading: isLoadingOrg, addLocation } = useOrganization();

  const debouncedQuery = useDebounce(searchQuery, 500);

  // Convert organization locations to the sidebar format
  const savedLocations: Location[] = (organization?.locations || [])
    .filter(loc => loc.active)
    .map(loc => ({
      id: loc.id,
      name: loc.name,
      state: loc.address?.split(',').pop()?.trim() || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));

  // Auto-select first location if none selected and locations exist
  useEffect(() => {
    if (!selectedLocation && savedLocations.length > 0) {
      onSelectLocation(savedLocations[0]);
    }
  }, [savedLocations.length, selectedLocation, onSelectLocation]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    async function fetchResults() {
      if (debouncedQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      const results = await searchLocations(debouncedQuery);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setIsSearching(false);
    }

    fetchResults();
  }, [debouncedQuery]);

  const handleSelectFromSearch = async (result: GeocodingResult) => {
    const location: Location = {
      id: result.id.toString(),
      name: result.name,
      state: result.admin1 || "",
      latitude: result.latitude,
      longitude: result.longitude,
    };
    
    // Check if already saved
    const alreadySaved = savedLocations.some(
      loc => Math.abs(loc.latitude - result.latitude) < 0.01 && 
             Math.abs(loc.longitude - result.longitude) < 0.01
    );

    if (!alreadySaved && organization) {
      // Save to organization
      const newLoc = await addLocation({
        name: result.name,
        address: result.admin1 ? `${result.name}, ${result.admin1}` : result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        type: 'operation_point',
        active: true,
      });
      
      if (newLoc) {
        onSelectLocation({
          id: newLoc.id,
          name: newLoc.name,
          state: result.admin1 || '',
          latitude: newLoc.latitude,
          longitude: newLoc.longitude,
        });
      }
    } else {
      onSelectLocation(location);
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
    <aside className="w-64 bg-card border-r border-border h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar localidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-8"
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
          <div className="absolute z-50 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectFromSearch(result)}
                className="w-full px-4 py-3 text-left hover:bg-muted flex items-center gap-3 transition-colors"
              >
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{result.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.admin1 ? `${result.admin1}, ` : ""}Brasil
                  </p>
                </div>
                <Plus className="w-4 h-4 text-primary flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showResults && searchResults.length === 0 && !isSearching && debouncedQuery.length >= 2 && (
          <div className="absolute z-50 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma localidade encontrada</p>
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
              <p className="text-xs mt-1">Busque acima para adicionar</p>
            </div>
          ) : (
            <div className="space-y-1">
              {savedLocations.map((location) => (
                <Button
                  key={location.id}
                  variant={selectedLocation?.id === location.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => onSelectLocation(location)}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">
                    {location.name}{location.state ? `, ${location.state}` : ''}
                  </span>
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
  );
}
