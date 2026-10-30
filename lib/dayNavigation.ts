import { placeQuery, places, stayById, stayQuery, type Day } from "./trip";

// Each route URL contains the requested stops in their saved order.
function stopLocation(id: string): string | null {
  if (id.startsWith("@")) {
    const stay = stayById(id.slice(1));
    return stay ? stayQuery(stay) : null;
  }
  const place = places[id];
  return place ? placeQuery(place) : null;
}

function directionsUrl(locations: string[], fromCurrentLocation: boolean): string {
  const params = new URLSearchParams({ api: "1" });
  // Without an origin, Google Maps uses the device's position when available.
  if (!fromCurrentLocation) params.set("origin", locations[0]);
  params.set("destination", locations[locations.length - 1]);
  params.set("travelmode", "driving");

  const waypoints = fromCurrentLocation ? locations.slice(0, -1) : locations.slice(1, -1);
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export type DayNavigation = {
  fullUrl: string;
  partUrls: string[];
  stopCount: number;
};

// Builds a route from a checked subset, optionally beginning at the device's location.
export function routeNavigation(stopIds: readonly string[], fromCurrentLocation = false): DayNavigation | null {
  const locations = stopIds.map(stopLocation);
  const minStops = fromCurrentLocation ? 1 : 2;
  // Don't silently skip an invalid stop or create an incomplete itinerary.
  if (locations.length < minStops || locations.some((location) => location === null)) return null;
  const stops = locations as string[];

  // Mobile browsers support at most 3 waypoints. Each part shares its
  // previous destination with the next part's explicit origin.
  const partUrls: string[] = [];
  if (fromCurrentLocation) {
    partUrls.push(directionsUrl(stops.slice(0, 4), true));
    for (let i = 3; i < stops.length - 1; i += 4) {
      partUrls.push(directionsUrl(stops.slice(i, i + 5), false));
    }
  } else {
    for (let i = 0; i < stops.length - 1; i += 4) {
      partUrls.push(directionsUrl(stops.slice(i, i + 5), false));
    }
  }

  return {
    fullUrl: directionsUrl(stops, fromCurrentLocation),
    partUrls,
    stopCount: stops.length,
  };
}

export function dayNavigation(day: Day): DayNavigation | null {
  return routeNavigation(day.stops);
}
