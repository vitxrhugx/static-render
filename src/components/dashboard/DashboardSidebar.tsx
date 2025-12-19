import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchLocations, GeocodingResult } from "@/lib/openmeteo";

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

// Demo saved locations (would come from database in production)
const savedLocations: Location[] = [
  { id: "1", name: "São Paulo", state: "SP", latitude: -23.5475, longitude: -46.6361 },
  { id: "2", name: "Rio de Janeiro", state: "RJ", latitude: -22.9068, longitude: -43.1729 },
  { id: "3", name: "Belo Horizonte", state: "MG", latitude: -19.9167, longitude: -43.9345 },
];

export function DashboardSidebar({ selectedLocation, onSelectLocation }: DashboardSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 500);

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

  const handleSelectFromSearch = (result: GeocodingResult) => {
    const location: Location = {
      id: result.id.toString(),
      name: result.name,
      state: result.admin1 || "",
      latitude: result.latitude,
      longitude: result.longitude,
    };
    onSelectLocation(location);
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
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{result.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.admin1 ? `${result.admin1}, ` : ""}Brasil
                  </p>
                </div>
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
