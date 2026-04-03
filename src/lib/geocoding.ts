// Advanced Geocoding Service
// Supports full addresses (street, number, neighborhood, city, state)
// Uses Nominatim (OpenStreetMap) for detailed geocoding + Open-Meteo for city-level fallback

export interface GeocodingResult {
  id: string;
  name: string;
  displayName: string; // Full formatted address
  latitude: number;
  longitude: number;
  type: "address" | "city" | "neighborhood" | "street";
  details: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    county?: string;
  };
}

function classifyType(result: NominatimResult): GeocodingResult["type"] {
  if (result.address.house_number) return "address";
  if (result.address.road) return "street";
  if (result.address.suburb || result.address.neighbourhood) return "neighborhood";
  return "city";
}

function formatDisplayName(addr: NominatimResult["address"]): string {
  const parts: string[] = [];
  
  if (addr.road) {
    let street = addr.road;
    if (addr.house_number) street += `, ${addr.house_number}`;
    parts.push(street);
  }
  
  if (addr.suburb || addr.neighbourhood) {
    parts.push(addr.suburb || addr.neighbourhood || "");
  }
  
  const city = addr.city || addr.town || addr.village;
  if (city) {
    parts.push(city);
  }
  
  if (addr.state) {
    parts.push(addr.state);
  }
  
  if (addr.postcode) {
    parts.push(`CEP ${addr.postcode}`);
  }
  
  return parts.filter(Boolean).join(" — ");
}

// Search using Nominatim for detailed address geocoding
export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 3) return [];

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "8");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("accept-language", "pt-BR");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Climatch/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data: NominatimResult[] = await response.json();

    return data.map((r) => ({
      id: `nom-${r.place_id}`,
      name: r.address.city || r.address.town || r.address.village || r.address.road || r.display_name.split(",")[0],
      displayName: formatDisplayName(r.address),
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      type: classifyType(r),
      details: {
        street: r.address.road,
        number: r.address.house_number,
        neighborhood: r.address.suburb || r.address.neighbourhood,
        city: r.address.city || r.address.town || r.address.village,
        state: r.address.state,
        postalCode: r.address.postcode,
      },
    }));
  } catch (error) {
    console.error("Error searching address:", error);
    return [];
  }
}

// Reverse geocoding: get address from coordinates
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", lat.toString());
    url.searchParams.set("lon", lon.toString());
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "pt-BR");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Climatch/1.0" },
    });

    if (!response.ok) return null;

    const r: NominatimResult = await response.json();

    return {
      id: `nom-${r.place_id}`,
      name: r.address.city || r.address.town || r.address.village || r.display_name.split(",")[0],
      displayName: formatDisplayName(r.address),
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      type: classifyType(r),
      details: {
        street: r.address.road,
        number: r.address.house_number,
        neighborhood: r.address.suburb || r.address.neighbourhood,
        city: r.address.city || r.address.town || r.address.village,
        state: r.address.state,
        postalCode: r.address.postcode,
      },
    };
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null;
  }
}
